import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account");

  const query = supabase
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
