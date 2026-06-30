import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { access_token } = await req.json();

  const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY!;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET!;

  await fetch("https://open.tiktokapis.com/v2/oauth/revoke/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      token: access_token,
    }).toString(),
  });

  return NextResponse.json({ success: true });
}
