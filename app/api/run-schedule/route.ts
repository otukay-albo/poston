import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { planChunks, chunkRanges } from "@/app/lib/chunk";

// 予約時刻が来た投稿をTikTokへ送る。
// 外部スケジューラ（cron-job.org）から数分おきに呼ばれる想定。
// 無料プランの実行時間に収めるため、1回の呼び出しで1件だけ処理する。

export const maxDuration = 60;

const BUCKET = "scheduled-videos";
const MAX_ATTEMPTS = 3;
// 無料プランの実行時間(60秒)で安全に扱えるサイズの目安。
// 実測で撮影動画は約110MB/分のため、これは30秒強に相当する。
const SIZE_WARN_BYTES = 60 * 1024 * 1024;

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  // cron-job.org からはヘッダーで、Vercel Cron からは Authorization で届く
  if (req.headers.get("x-cron-secret") === secret) return true;
  if (req.headers.get("authorization") === `Bearer ${secret}`) return true;
  return false;
}

// 失効間近ならリフレッシュして有効なアクセストークンを返す
async function ensureToken(open_id: string): Promise<string | null> {
  const { data: acc } = await supabase
    .from("tiktok_accounts")
    .select("*")
    .eq("open_id", open_id)
    .single();
  if (!acc) return null;

  const BUFFER_MS = 5 * 60 * 1000;
  if (acc.expires_at && Date.now() < acc.expires_at - BUFFER_MS) return acc.access_token;
  if (!acc.refresh_token) return acc.access_token;

  const params = new URLSearchParams({
    client_key: process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY!,
    client_secret: process.env.TIKTOK_CLIENT_SECRET!,
    grant_type: "refresh_token",
    refresh_token: acc.refresh_token,
  });
  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });
  const data = await res.json();
  if (data.error || !data.access_token) return null;

  await supabase
    .from("tiktok_accounts")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? acc.refresh_token,
      expires_at: typeof data.expires_in === "number" ? Date.now() + data.expires_in * 1000 : null,
      updated_at: new Date().toISOString(),
    })
    .eq("open_id", open_id);
  return data.access_token as string;
}

interface Due {
  id: string;
  open_id: string;
  account_name: string | null;
  title: string;
  privacy_level: string;
  disable_comment: boolean;
  disable_duet: boolean;
  disable_stitch: boolean;
  brand_content_toggle: boolean;
  brand_organic_toggle: boolean;
  video_path: string | null;
  video_size: number | null;
  attempts: number;
}

async function fail(id: string, attempts: number, message: string) {
  const over = attempts + 1 >= MAX_ATTEMPTS;
  await supabase
    .from("scheduled_posts")
    .update({
      attempts: attempts + 1,
      error: message,
      // 上限まで試したら諦める。それまでは次回の実行で再試行する
      status: over ? "失敗" : "予約",
    })
    .eq("id", id);
  return { ok: false, error: message, gaveUp: over };
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 時刻が来ていて、まだ投稿していないものを1件だけ取る
  const { data: rows, error: qErr } = await supabase
    .from("scheduled_posts")
    .select("*")
    .eq("status", "予約")
    .lte("run_at", new Date().toISOString())
    .order("run_at", { ascending: true })
    .limit(1);

  if (qErr) return NextResponse.json({ error: qErr.message }, { status: 500 });
  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: true, message: "実行する予約はありません" });
  }

  const post = rows[0] as Due;
  const label = post.account_name || post.open_id.slice(0, 8);

  try {
    if (!post.video_path) {
      return NextResponse.json(await fail(post.id, post.attempts, "動画が保存されていません"));
    }

    const token = await ensureToken(post.open_id);
    if (!token) {
      return NextResponse.json(
        await fail(post.id, post.attempts, "アカウントのログイン情報が無効です。再ログインしてください")
      );
    }

    // 1) 保管してある動画を取り出す
    const dl = await supabaseAdmin.storage.from(BUCKET).download(post.video_path);
    if (dl.error || !dl.data) {
      return NextResponse.json(
        await fail(post.id, post.attempts, `動画を読み込めませんでした: ${dl.error?.message ?? "不明"}`)
      );
    }
    const blob = dl.data;
    const size = blob.size;

    // 2) TikTokに投稿の枠を作る
    const plan = planChunks(size);
    const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json; charset=UTF-8",
      },
      body: JSON.stringify({
        post_info: {
          title: post.title || "",
          privacy_level: post.privacy_level || "SELF_ONLY",
          disable_comment: !!post.disable_comment,
          disable_duet: !!post.disable_duet,
          disable_stitch: !!post.disable_stitch,
          brand_content_toggle: !!post.brand_content_toggle,
          brand_organic_toggle: !!post.brand_organic_toggle,
        },
        source_info: {
          source: "FILE_UPLOAD",
          video_size: size,
          chunk_size: plan.chunk_size,
          total_chunk_count: plan.total_chunk_count,
        },
      }),
    });
    const initData = await initRes.json();
    if (initData.error && initData.error.code !== "ok") {
      return NextResponse.json(
        await fail(post.id, post.attempts, `TikTokが投稿を受け付けませんでした: ${initData.error.message}`)
      );
    }

    // 3) 動画をTikTokへ送る（分割ルールに従って順番に）
    const buf = new Uint8Array(await blob.arrayBuffer());
    for (const { start, end } of chunkRanges(size, plan)) {
      const put = await fetch(initData.data.upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": "video/mp4",
          "Content-Range": `bytes ${start}-${end}/${size}`,
        },
        body: buf.slice(start, end + 1),
      });
      if (!put.ok) {
        return NextResponse.json(
          await fail(post.id, post.attempts, `動画の送信に失敗しました (${put.status})`)
        );
      }
    }

    // 4) 投稿済みにして、保管していた動画を消す
    await supabase
      .from("scheduled_posts")
      .update({ status: "投稿済み", posted_at: new Date().toISOString(), error: null })
      .eq("id", post.id);
    await supabaseAdmin.storage.from(BUCKET).remove([post.video_path]);

    return NextResponse.json({
      ok: true,
      posted: { account: label, size_mb: Number((size / 1048576).toFixed(1)) },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // 時間切れはサイズが原因のことが多いので、理由を具体的に残す
    const hint =
      post.video_size && post.video_size > SIZE_WARN_BYTES
        ? `${msg}（動画が大きい可能性があります: ${(post.video_size / 1048576).toFixed(0)}MB）`
        : msg;
    return NextResponse.json(await fail(post.id, post.attempts, hint));
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
