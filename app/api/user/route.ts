import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const access_token = req.nextUrl.searchParams.get("access_token");

  const res = await fetch(
    "https://open.tiktokapis.com/v2/user/info/?fields=display_name,avatar_url,follower_count,following_count,likes_count,video_count",
    {
      headers: { Authorization: `Bearer ${access_token}` },
    }
  );

  const data = await res.json();

  if (data.error?.code !== "ok") {
    return NextResponse.json({ error: data.error?.message || "取得失敗" }, { status: 400 });
  }

  return NextResponse.json(data.data?.user || {});
}
