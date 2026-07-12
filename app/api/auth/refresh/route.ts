import { NextRequest, NextResponse } from "next/server";

// アクセストークンが切れたとき、リフレッシュトークンを使って
// 新しいアクセストークンを取得する（再ログイン不要にするため）。
export async function POST(req: NextRequest) {
  const { refresh_token } = await req.json();

  if (!refresh_token) {
    return NextResponse.json({ error: "refresh_token is required" }, { status: 400 });
  }

  const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY!;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;

  const params = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    grant_type: "refresh_token",
    refresh_token,
  });

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();

  if (data.error) {
    return NextResponse.json({ error: data.error_description || data.error, detail: data }, { status: 400 });
  }

  // TikTokはリフレッシュ時にrefresh_tokenも新しく発行する（ローテーション）ため保存し直す
  return NextResponse.json({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    open_id: data.open_id,
    scope: data.scope,
    expires_in: data.expires_in,
    refresh_expires_in: data.refresh_expires_in,
  });
}
