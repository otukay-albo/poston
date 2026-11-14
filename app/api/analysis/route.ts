import { NextRequest, NextResponse } from "next/server";
// DBへのアクセスはサーバー専用キーで行う（テーブルはRLSで保護し、公開キーでは読み書きできない）
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account");

  const query = supabaseAdmin
    .from("video_stats")
    .select("account_name, title, view_count, like_count, comment_count, share_count, engagement_rate, posted_at, fetched_at")
    .order("fetched_at", { ascending: false });

  if (account && account !== "全アカウント") {
    query.eq("account_name", account);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rows: data || [] });
}
