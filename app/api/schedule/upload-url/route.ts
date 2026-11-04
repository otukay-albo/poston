import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, hasServiceKey } from "@/lib/supabaseAdmin";

// 予約投稿用の動画をアップロードするための署名付きURLを発行する。
// ブラウザはこのURLへ直接アップロードするため、Vercelのリクエスト上限(4.5MB)を回避できる。
// バケットは非公開のままなので、URLを持つ人以外は読めない。

const BUCKET = "scheduled-videos";

export async function POST(req: NextRequest) {
  const teamKey = process.env.POSTON_TEAM_KEY;
  if (!teamKey) {
    return NextResponse.json(
      { error: "サーバー側でチームキーが未設定です（POSTON_TEAM_KEY）" },
      { status: 503 }
    );
  }
  if (req.headers.get("x-team-key") !== teamKey) {
    return NextResponse.json({ error: "チームキーが正しくありません" }, { status: 401 });
  }
  if (!hasServiceKey) {
    return NextResponse.json(
      { error: "サーバー側で SUPABASE_SERVICE_ROLE_KEY が未設定です（予約投稿には必要です）" },
      { status: 503 }
    );
  }

  const { filename } = await req.json().catch(() => ({ filename: "" }));
  const ext = (String(filename || "").match(/\.(mp4|mov|m4v)$/i)?.[1] || "mp4").toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(path);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ path, signedUrl: data.signedUrl, token: data.token });
}
