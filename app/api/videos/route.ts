import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const access_token = req.nextUrl.searchParams.get("access_token");

  const res = await fetch(
    "https://open.tiktokapis.com/v2/video/list/?fields=id,title,cover_image_url,view_count,like_count,comment_count,share_count,create_time",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ max_count: 20 }),
    }
  );

  const data = await res.json();

  if (data.error?.code !== "ok") {
    return NextResponse.json({ videos: [] });
  }

  return NextResponse.json({ videos: data.data?.videos || [] });
}
