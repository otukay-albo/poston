import { NextRequest, NextResponse } from "next/server";
// DBへのアクセスはサーバー専用キーで行う（テーブルはRLSで保護し、公開キーでは読み書きできない）
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { latestStats } from "@/lib/latestStats";

const FIELDS =
  "account_name, title, view_count, like_count, comment_count, share_count, engagement_rate, posted_at, fetched_at";

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account");

  // アカウント指定あり：動画ごとの最新スナップショットを返す
  if (account && account !== "全アカウント") {
    const { rows, error } = await latestStats(account);
    if (error) return NextResponse.json({ error }, { status: 500 });
    return NextResponse.json({
      rows: rows.map((r) => ({
        account_name: r.account_name,
        title: r.title,
        view_count: r.view_count,
        like_count: r.like_count,
        comment_count: r.comment_count,
        share_count: r.share_count,
        engagement_rate: r.engagement_rate,
        posted_at: r.posted_at,
        fetched_at: r.fetched_at,
      })),
    });
  }

  // 指定なし：全アカウントの直近の行（新しい順）
  const { data, error } = await supabaseAdmin
    .from("video_stats")
    .select(FIELDS)
    .order("fetched_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data || [] });
}
