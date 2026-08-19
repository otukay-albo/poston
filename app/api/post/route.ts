import { NextRequest, NextResponse } from "next/server";

// 動画本体はブラウザから直接TikTokへPUTするため、このAPIは「初期化」だけを担当する。
// （Vercelのリクエストボディ上限 4.5MB を回避するため）
export async function POST(req: NextRequest) {
  const {
    access_token,
    title,
    privacy_level,
    disable_duet,
    disable_stitch,
    disable_comment,
    video_size,
    brand_content_toggle,
    brand_organic_toggle,
  } = await req.json();

  if (!access_token) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 400 });
  }
  if (!video_size) {
    return NextResponse.json({ error: "動画サイズが取得できませんでした" }, { status: 400 });
  }

  const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      post_info: {
        title: title || "",
        privacy_level: privacy_level || "SELF_ONLY",
        disable_duet: !!disable_duet,
        disable_stitch: !!disable_stitch,
        disable_comment: !!disable_comment,
        // 商用コンテンツ開示（TikTok UXガイドライン必須項目）
        brand_content_toggle: !!brand_content_toggle, // タイアップ投稿
        brand_organic_toggle: !!brand_organic_toggle, // 自社ブランドの宣伝
      },
      source_info: {
        source: "FILE_UPLOAD",
        video_size,
        chunk_size: video_size,
        total_chunk_count: 1,
      },
    }),
  });

  const initData = await initRes.json();
  console.log("TikTok init response:", JSON.stringify(initData));

  if (initData.error && initData.error.code !== "ok") {
    return NextResponse.json(
      {
        error: initData.error.message || "TikTokの初期化に失敗しました",
        code: initData.error.code,
        detail: initData.error,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    upload_url: initData.data.upload_url,
    publish_id: initData.data.publish_id,
  });
}
