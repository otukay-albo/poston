import { NextRequest, NextResponse } from "next/server";

// TikTok Direct Post の必須ステップ。
// 投稿前に「そのアカウントで許可されている公開範囲」や
// 「コメント/デュエット/スティッチが使えるか」を取得する。
// 審査前アプリでは privacy_level_options が ["SELF_ONLY"] のみになる。
export async function POST(req: NextRequest) {
  const { access_token } = await req.json();

  if (!access_token) {
    return NextResponse.json({ error: "ログインが必要です" }, { status: 400 });
  }

  const res = await fetch("https://open.tiktokapis.com/v2/post/publish/creator_info/query/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
  });

  const data = await res.json();
  console.log("TikTok creator_info response:", JSON.stringify(data));

  if (data.error && data.error.code !== "ok") {
    return NextResponse.json(
      { error: data.error.message || "投稿情報の取得に失敗しました", code: data.error.code, detail: data.error },
      { status: 400 }
    );
  }

  return NextResponse.json(data.data);
}
