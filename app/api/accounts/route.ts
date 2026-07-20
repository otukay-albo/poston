import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// 接続済みTikTokアカウント（トークン）のサーバー保存API。
// どのブラウザ/PCからでも同じアカウント群を使えるようにする（チーム共有）。
// 認可: 環境変数 POSTON_TEAM_KEY と一致する x-team-key ヘッダーが必要。
//
// 必要なSupabaseテーブル:
//   create table tiktok_accounts (
//     open_id text primary key,
//     display_name text,
//     avatar_url text,
//     analytics_name text,
//     access_token text not null,
//     refresh_token text,
//     expires_at bigint,
//     updated_at timestamptz default now()
//   );

function authorize(req: NextRequest): NextResponse | null {
  const key = process.env.POSTON_TEAM_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "サーバー未設定: Vercelの環境変数 POSTON_TEAM_KEY を設定してください" },
      { status: 503 }
    );
  }
  if (req.headers.get("x-team-key") !== key) {
    return NextResponse.json({ error: "チームキーが正しくありません" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const denied = authorize(req);
  if (denied) return denied;

  const { data, error } = await supabase.from("tiktok_accounts").select("*");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ accounts: data || [] });
}

export async function POST(req: NextRequest) {
  const denied = authorize(req);
  if (denied) return denied;

  const b = await req.json();
  if (!b.open_id || !b.access_token) {
    return NextResponse.json({ error: "open_id と access_token は必須です" }, { status: 400 });
  }

  const { error } = await supabase.from("tiktok_accounts").upsert(
    {
      open_id: b.open_id,
      display_name: b.display_name ?? null,
      avatar_url: b.avatar_url ?? null,
      analytics_name: b.analytics_name ?? null,
      access_token: b.access_token,
      refresh_token: b.refresh_token ?? null,
      expires_at: b.expires_at ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "open_id" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = authorize(req);
  if (denied) return denied;

  const { open_id } = await req.json();
  if (!open_id) return NextResponse.json({ error: "open_id は必須です" }, { status: 400 });

  const { error } = await supabase.from("tiktok_accounts").delete().eq("open_id", open_id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
