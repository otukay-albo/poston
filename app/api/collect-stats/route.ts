import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Poston自身によるデータ収集（GASの置き換え）。
// チーム同期(tiktok_accounts)に登録された全アカウントの動画統計を
// TikTok APIから取得し、video_stats にスナップショットとして蓄積する。
//
// 実行方法:
//  - Vercel Cron（vercel.jsonで定期実行。環境変数 CRON_SECRET を設定すると
//    Vercelが Authorization: Bearer <CRON_SECRET> を自動付与する）
//  - 手動実行（x-team-key ヘッダー = POSTON_TEAM_KEY。アナリティクス画面のボタンから）

export const maxDuration = 60;

const FIELDS = "id,title,video_description,duration,create_time,like_count,comment_count,share_count,view_count";

function authorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`) return true;
  const teamKey = process.env.POSTON_TEAM_KEY;
  if (teamKey && req.headers.get("x-team-key") === teamKey) return true;
  return false;
}

interface AccountRow {
  open_id: string;
  display_name: string | null;
  analytics_name: string | null;
  access_token: string;
  refresh_token: string | null;
  expires_at: number | null;
}

interface TikTokVideo {
  id: string;
  title?: string;
  video_description?: string;
  duration?: number;
  create_time?: number;
  like_count?: number;
  comment_count?: number;
  share_count?: number;
  view_count?: number;
}

// 失効間近ならリフレッシュし、有効なアクセストークンを返す（DBも更新）
async function ensureToken(acc: AccountRow): Promise<string | null> {
  const BUFFER_MS = 5 * 60 * 1000;
  if (acc.expires_at && Date.now() < acc.expires_at - BUFFER_MS) return acc.access_token;
  if (!acc.refresh_token) return acc.access_token; // 期限不明・更新不可はそのまま試す

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
    .eq("open_id", acc.open_id);
  return data.access_token as string;
}

// 動画一覧をページングで取得（最大5ページ=100本まで）
async function fetchVideos(token: string): Promise<TikTokVideo[] | null> {
  const videos: TikTokVideo[] = [];
  let cursor: number | undefined;
  for (let page = 0; page < 5; page++) {
    const res = await fetch(`https://open.tiktokapis.com/v2/video/list/?fields=${FIELDS}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ max_count: 20, ...(cursor ? { cursor } : {}) }),
    });
    const data = await res.json();
    if (data.error?.code !== "ok") return page === 0 ? null : videos;
    videos.push(...(data.data?.videos || []));
    if (!data.data?.has_more) break;
    cursor = data.data.cursor;
  }
  return videos;
}

async function handle(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { data: accounts, error: accErr } = await supabase.from("tiktok_accounts").select("*");
  if (accErr) return NextResponse.json({ error: accErr.message }, { status: 500 });
  if (!accounts || accounts.length === 0) {
    return NextResponse.json({ ok: true, message: "チーム同期にアカウントが登録されていません", results: [] });
  }

  const fetched_at = new Date().toISOString();
  const results: { account: string; videos?: number; inserted?: number; error?: string }[] = [];

  for (const acc of accounts as AccountRow[]) {
    const label = acc.analytics_name || acc.display_name || acc.open_id.slice(0, 8);
    try {
      const token = await ensureToken(acc);
      if (!token) {
        results.push({ account: label, error: "トークン更新に失敗（再ログインが必要な可能性）" });
        continue;
      }
      const videos = await fetchVideos(token);
      if (videos === null) {
        results.push({ account: label, error: "動画一覧の取得に失敗" });
        continue;
      }

      // 分析データ名が未設定なら表示名で自動設定（分析画面が自動で紐づくように）
      const account_name = acc.analytics_name || acc.display_name || acc.open_id.slice(0, 8);
      if (!acc.analytics_name) {
        await supabase.from("tiktok_accounts").update({ analytics_name: account_name }).eq("open_id", acc.open_id);
      }

      const records = videos.map((v) => {
        const views = v.view_count || 0;
        const engagement = views > 0
          ? Number((((v.like_count || 0) + (v.comment_count || 0) + (v.share_count || 0)) / views * 100).toFixed(2))
          : 0;
        return {
          account_name,
          video_id: String(v.id),
          title: v.title || v.video_description || "",
          view_count: views,
          like_count: v.like_count || 0,
          comment_count: v.comment_count || 0,
          share_count: v.share_count || 0,
          engagement_rate: engagement,
          duration_seconds: v.duration ?? null,
          posted_at: v.create_time ? new Date(v.create_time * 1000).toISOString() : null,
          fetched_at,
        };
      });

      if (records.length > 0) {
        const { error } = await supabase.from("video_stats").insert(records);
        if (error) {
          results.push({ account: label, error: error.message });
          continue;
        }
      }
      results.push({ account: label, videos: videos.length, inserted: records.length });
    } catch (e) {
      results.push({ account: label, error: e instanceof Error ? e.message : String(e) });
    }
  }

  return NextResponse.json({ ok: true, fetched_at, results });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
