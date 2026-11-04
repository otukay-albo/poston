import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

// 予約投稿の一覧・作成・削除。
// サーバーが予約時刻に自動投稿するため、予約はブラウザではなくDBに置く。
// アクセスはチームキー（POSTON_TEAM_KEY）で制限する。

function authorized(req: NextRequest): boolean {
  const teamKey = process.env.POSTON_TEAM_KEY;
  if (!teamKey) return false;
  return req.headers.get("x-team-key") === teamKey;
}

function guard(req: NextRequest) {
  if (!process.env.POSTON_TEAM_KEY) {
    return NextResponse.json(
      { error: "サーバー側でチームキーが未設定です（POSTON_TEAM_KEY）" },
      { status: 503 }
    );
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "チームキーが正しくありません" }, { status: 401 });
  }
  return null;
}

export async function GET(req: NextRequest) {
  const ng = guard(req);
  if (ng) return ng;

  const { data, error } = await supabase
    .from("scheduled_posts")
    .select("*")
    .order("run_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ posts: data || [] });
}

export async function POST(req: NextRequest) {
  const ng = guard(req);
  if (ng) return ng;

  const b = await req.json();
  if (!b.open_id || !b.run_at) {
    return NextResponse.json({ error: "open_id と run_at は必須です" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("scheduled_posts")
    .insert({
      open_id: b.open_id,
      account_name: b.account_name ?? null,
      run_at: b.run_at,
      title: b.title ?? "",
      privacy_level: b.privacy_level ?? "SELF_ONLY",
      disable_comment: b.disable_comment ?? true,
      disable_duet: b.disable_duet ?? true,
      disable_stitch: b.disable_stitch ?? true,
      brand_content_toggle: b.brand_content_toggle ?? false,
      brand_organic_toggle: b.brand_organic_toggle ?? false,
      video_path: b.video_path ?? null,
      video_size: b.video_size ?? null,
      status: "予約",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ post: data });
}

export async function DELETE(req: NextRequest) {
  const ng = guard(req);
  if (ng) return ng;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id は必須です" }, { status: 400 });

  // 予約を消すときは、保管していた動画も消す（容量を無駄にしないため）
  const { data: row } = await supabase
    .from("scheduled_posts")
    .select("video_path")
    .eq("id", id)
    .single();
  if (row?.video_path) {
    await supabaseAdmin.storage.from("scheduled-videos").remove([row.video_path]);
  }

  const { error } = await supabase.from("scheduled_posts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
