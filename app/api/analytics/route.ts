import { NextRequest, NextResponse } from "next/server";
import { latestStats } from "@/lib/latestStats";

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account");

  if (!account) {
    return NextResponse.json({ error: "account is required" }, { status: 400 });
  }

  // 動画ごとの最新スナップショットだけを返す（画面側もこの単位でしか使わない）
  const { rows: data, error } = await latestStats(account);
  if (error) {
    return NextResponse.json({ error }, { status: 500 });
  }

  const rows = data.map((r) => ({
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
