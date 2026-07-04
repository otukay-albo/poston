import { NextRequest, NextResponse } from "next/server";

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const access_token = formData.get("access_token") as string;
  const video = formData.get("video") as File;
  const title = (formData.get("title") as string) || "";
  const privacy_level = (formData.get("privacy_level") as string) || "PUBLIC_TO_EVERYONE";
  const disable_duet = formData.get("disable_duet") === "true";
  const disable_stitch = formData.get("disable_stitch") === "true";
  const disable_comment = formData.get("disable_comment") === "true";

  if (!access_token) {
    return NextResponse.json({ error: "access_token is required" }, { status: 400 });
  }
  if (!video) {
    return NextResponse.json({ error: "video is required" }, { status: 400 });
  }

  // Step 1: Initialize upload
  const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title,
        privacy_level,
        disable_duet,
        disable_stitch,
        disable_comment,
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size: video.size,
        chunk_size: video.size,
        total_chunk_count: 1,
      },
    }),
  });

  const initData = await initRes.json();
  if (initData.error?.code !== "ok") {
    const msg = initData.error?.message || "Init failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const { publish_id, upload_url } = initData.data;

  // Step 2: Upload video
  const videoBuffer = await video.arrayBuffer();
  const uploadRes = await fetch(upload_url, {
    method: "PUT",
    headers: {
      "Content-Type": "video/mp4",
      "Content-Range": `bytes 0-${video.size - 1}/${video.size}`,
      "Content-Length": String(video.size),
    },
    body: videoBuffer,
  });

  if (!uploadRes.ok) {
    return NextResponse.json({ error: `Upload failed: ${uploadRes.status}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, publish_id });
}
