import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const account = req.nextUrl.searchParams.get("account");

  if (!account) {
    return NextResponse.json({ error: "account is required" }, { status: 400 });
  }

  const base = process.env.GAS_API_BASE;
  const key = process.env.GAS_API_KEY;

  if (!base || !key) {
    return NextResponse.json({ error: "server configuration error" }, { status: 500 });
  }

  const url = `${base}?mode=data&account=${encodeURIComponent(account)}&key=${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url, { redirect: "follow" });
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ error: "fetch failed" }, { status: 500 });
  }
}
