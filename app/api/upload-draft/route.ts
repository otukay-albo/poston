import { NextRequest, NextResponse } from "next/server";
import { planChunks, MAX_VIDEO_BYTES } from "@/app/lib/chunk";

// 動画をTikTokの「下書き」として送る（video.upload スコープ）。
// 公開投稿(Direct Post)と異なり、投稿はユーザーがTikTokアプリ内で
// 音楽やエフェクトを追加してから自分で行う。
// 動画本体はブラウザから直接TikTokへPUTするため、ここは初期化のみ。
export async function POST(req: NextRequest) {
  const { access_token, video_size } = await req.json();

  if (!access_token) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 400 });
  }
  if (!video_size) {
    return NextResponse.json({ error: "動画サイズが取得できませんでした" }, { status: 400 });
  }
  if (video_size > MAX_VIDEO_BYTES) {
    return NextResponse.json({ error: "動画が大きすぎます（上限4GB）" }, { status: 400 });
  }

  // TikTokの分割ルールに沿ってチャンク構成を決める
  const plan = planChunks(video_size);

  const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/inbox/video/init/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      source_info: {
        source: "FILE_UPLOAD",
        video_size,
        chunk_size: plan.chunk_size,
        total_chunk_count: plan.total_chunk_count,
      },
    }),
  });

  const initData = await initRes.json();
  console.log("TikTok inbox init response:", JSON.stringify(initData));

  if (initData.error && initData.error.code !== "ok") {
    return NextResponse.json(
      {
        error: initData.error.message || "下書きの初期化に失敗しました",
        code: initData.error.code,
        // 原因切り分け用に、実際に送った値を返す
        sent: { video_size, chunk_size: plan.chunk_size, total_chunk_count: plan.total_chunk_count },
        detail: initData.error,
      },
      { status: 400 }
    );
  }

  return NextResponse.json({
    upload_url: initData.data.upload_url,
    publish_id: initData.data.publish_id,
    chunk_size: plan.chunk_size,
    total_chunk_count: plan.total_chunk_count,
  });
}
