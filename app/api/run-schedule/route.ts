import { NextRequest, NextResponse, after } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { planChunks, chunkRanges } from "@/app/lib/chunk";

// 予約時刻が来た投稿をTikTokへ送る。
// 外部スケジューラ（cron-job.org）から数分おきに呼ばれる想定。
//
// - 呼び出しにはすぐ応答し、投稿処理は応答後に続ける（after）。
//   cron-job.org は応答を30秒しか待たないため、待たせると「失敗」と記録され、
//   失敗が続くとジョブ自体が止められてしまう。
// - 時間に余裕がある限り、1回の実行で複数の予約を順に処理する
//   （別アカウントの同時刻の予約も、同じ回でまとめて投稿できる）。

export const maxDuration = 60;

const BUCKET = "scheduled-videos";
const MAX_ATTEMPTS = 3;
// この時間を過ぎたら、その回では新しい投稿を始めない（実行時間60秒に収めるため）。
// 途中で打ち切られた投稿は試行回数を消費するので、余裕を持たせる。
const START_BUDGET_MS = 20_000;
// 1回の実行で処理する件数の上限（暴走防止）
const MAX_PER_RUN = 10;
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
  const { data: acc } = await supabaseAdmin
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

  await supabaseAdmin
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

// 失敗を記録する。試行回数は着手時（claim）に加算済みなので、ここでは増やさない。
async function fail(id: string, attempts: number, message: string) {
  const over = attempts >= MAX_ATTEMPTS;
  await supabaseAdmin
    .from("scheduled_posts")
    .update({
      error: message,
      // 上限まで試したら諦める。それまでは次回の実行で再試行する
      status: over ? "失敗" : "予約",
    })
    .eq("id", id);
  return { ok: false, error: message, gaveUp: over };
}

// 次に処理する予約を1件確保する。
// 着手した時点で試行回数を増やしておくことで、実行時間切れで強制終了された場合も
// 「1回試した」と数えられる（数えないと、大きすぎる動画が永遠に再試行され、
// 後ろの予約をすべて止めてしまう）。
async function claimNext(): Promise<Due | null> {
  for (let guard = 0; guard < 20; guard++) {
    // 初めての予約を優先し、再試行は後回しにする（問題のある1件が列を塞がないように）
    const { data: rows } = await supabaseAdmin
      .from("scheduled_posts")
      .select("*")
      .eq("status", "予約")
      .lte("run_at", new Date().toISOString())
      .order("attempts", { ascending: true })
      .order("run_at", { ascending: true })
      .limit(1);
    if (!rows || rows.length === 0) return null;
    const post = rows[0] as Due;

    // 上限まで試しても完了の記録が無い＝毎回、時間切れで打ち切られている
    if (post.attempts >= MAX_ATTEMPTS) {
      const mb = post.video_size ? `${(post.video_size / 1048576).toFixed(0)}MB` : "サイズ不明";
      await supabaseAdmin
        .from("scheduled_posts")
        .update({
          status: "失敗",
          error: `時間内に投稿を完了できませんでした（動画: ${mb}）。動画を小さくするか「今すぐ投稿」をご利用ください。`,
        })
        .eq("id", post.id);
      continue;
    }

    // 試行回数を条件付きで更新して確保する（同時に動いた別の実行と重複しないように）
    const { data: claimed } = await supabaseAdmin
      .from("scheduled_posts")
      .update({
        attempts: post.attempts + 1,
        error: "投稿を開始しましたが、完了が記録されていません（時間切れの可能性があります）",
      })
      .eq("id", post.id)
      .eq("attempts", post.attempts)
      .eq("status", "予約")
      .select();
    if (claimed && claimed.length > 0) return { ...post, attempts: post.attempts + 1 };
    // 別の実行に先を越された場合は、次の候補を探す
  }
  return null;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 何件待っているかだけ数えて、すぐ応答する
  const { count } = await supabaseAdmin
    .from("scheduled_posts")
    .select("id", { count: "exact", head: true })
    .eq("status", "予約")
    .lte("run_at", new Date().toISOString());

  if (!count) {
    return NextResponse.json({ ok: true, message: "実行する予約はありません" });
  }

  const startedAt = Date.now();
  after(async () => {
    for (let n = 0; n < MAX_PER_RUN; n++) {
      // 残り時間が少なければ、新しい投稿は次の回に回す（1件目は必ず処理する）
      if (n > 0 && Date.now() - startedAt > START_BUDGET_MS) break;
      const post = await claimNext();
      if (!post) break;
      const r = await processOne(post);
      console.log("run-schedule:", post.account_name || post.open_id.slice(0, 8), JSON.stringify(r));
    }
  });

  return NextResponse.json({ ok: true, message: `${count}件の予約の処理を開始しました` });
}

// 予約1件をTikTokへ投稿する
async function processOne(post: Due): Promise<Record<string, unknown>> {
  const label = post.account_name || post.open_id.slice(0, 8);

  try {
    if (!post.video_path) {
      return (await fail(post.id, post.attempts, "動画が保存されていません"));
    }

    const token = await ensureToken(post.open_id);
    if (!token) {
      return await fail(post.id, post.attempts, "アカウントのログイン情報が無効です。再ログインしてください");
    }

    // 1) 保管してある動画を取り出す
    const dl = await supabaseAdmin.storage.from(BUCKET).download(post.video_path);
    if (dl.error || !dl.data) {
      return await fail(post.id, post.attempts, `動画を読み込めませんでした: ${dl.error?.message ?? "不明"}`);
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
      return await fail(post.id, post.attempts, `TikTokが投稿を受け付けませんでした: ${initData.error.message}`);
    }

    // 3) 動画をTikTokへ送る（分割ルールに従って順番に）
    // 保存したファイルの形式に合わせる（MOVをmp4として送ると処理に失敗することがある）
    const ext = post.video_path.split(".").pop()?.toLowerCase();
    const contentType =
      ext === "mov" ? "video/quicktime" : ext === "webm" ? "video/webm" : "video/mp4";
    const buf = new Uint8Array(await blob.arrayBuffer());
    for (const { start, end } of chunkRanges(size, plan)) {
      const put = await fetch(initData.data.upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": contentType,
          "Content-Range": `bytes ${start}-${end}/${size}`,
        },
        body: buf.slice(start, end + 1),
      });
      if (!put.ok) {
        return await fail(post.id, post.attempts, `動画の送信に失敗しました (${put.status})`);
      }
    }

    // 4) 投稿済みにして、保管していた動画を消す
    await supabaseAdmin
      .from("scheduled_posts")
      .update({ status: "投稿済み", posted_at: new Date().toISOString(), error: null })
      .eq("id", post.id);
    await supabaseAdmin.storage.from(BUCKET).remove([post.video_path]);

    return {
      ok: true,
      posted: { account: label, size_mb: Number((size / 1048576).toFixed(1)) },
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // 時間切れはサイズが原因のことが多いので、理由を具体的に残す
    const hint =
      post.video_size && post.video_size > SIZE_WARN_BYTES
        ? `${msg}（動画が大きい可能性があります: ${(post.video_size / 1048576).toFixed(0)}MB）`
        : msg;
    return (await fail(post.id, post.attempts, hint));
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
