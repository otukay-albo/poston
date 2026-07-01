import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account");

  if (!account) {
    return NextResponse.json({ error: "account is required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("video_stats")
    .select("*")
    .eq("account_name", account)
    .order("fetched_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data || []).map((r) => ({
    取得日時: r.fetched_at,
    動画ID: r.video_id,
    タイトル: r.title,
    再生数: r.view_count,
    いいね数: r.like_count,
    コメント数: r.comment_count,
    シェア数: r.share_count,
    "エンゲージメント率(%)": r.engagement_rate,
    投稿日時: r.posted_at,
    "動画時間(秒)": r.duration_seconds,
  }));

  return NextResponse.json({ rows });
}
