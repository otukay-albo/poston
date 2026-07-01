import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const API_KEY = process.env.GAS_API_KEY;

export async function POST(req: NextRequest) {
  const key = req.headers.get("x-api-key");
  if (key !== API_KEY) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { account_name, rows } = body;

  if (!account_name || !Array.isArray(rows)) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const records = rows.map((r: Record<string, unknown>) => ({
    account_name,
    video_id: String(r["動画ID"] || ""),
    title: String(r["タイトル"] || ""),
    view_count: Number(r["再生数"]) || 0,
    like_count: Number(r["いいね数"]) || 0,
    comment_count: Number(r["コメント数"]) || 0,
    share_count: Number(r["シェア数"]) || 0,
    engagement_rate: Number(r["エンゲージメント率(%)"]) || 0,
    duration_seconds: Number(r["動画時間(秒)"]) || null,
    posted_at: r["投稿日時"] ? new Date(String(r["投稿日時"])).toISOString() : null,
    fetched_at: r["取得日時"] ? new Date(String(r["取得日時"])).toISOString() : new Date().toISOString(),
  }));

  const { error } = await supabase.from("video_stats").insert(records);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, inserted: records.length });
}
