import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { code, code_verifier } = await req.json();

  const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY!;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;
  // 環境変数があればそれを使う（サンドボックス切替や別ドメイン展開に対応）
  // ※ トークン交換時のredirect_uriは認可時と完全一致が必須
  const redirectUri =
    process.env.NEXT_PUBLIC_REDIRECT_URI || "https://poston-app-five.vercel.app/callback";

  const params = new URLSearchParams({
    client_key: clientKey,
    client_secret: clientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code_verifier,
  });

  const res = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const data = await res.json();

  console.log("TikTok token response:", JSON.stringify(data));

  if (data.error) {
    return NextResponse.json({ error: data.error_description || data.error, detail: data }, { status: 400 });
  }

  return NextResponse.json({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    open_id: data.open_id,
    scope: data.scope,
    expires_in: data.expires_in,
    refresh_expires_in: data.refresh_expires_in,
  });
}
