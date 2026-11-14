import { NextResponse } from "next/server";
import { supabaseAdmin, hasServiceKey } from "@/lib/supabaseAdmin";

// 稼働確認用。秘密の値やデータは返さず、「設定されているか」「DBに届くか」だけを返す。
// テーブルをRLSで保護した後も、サーバーからは読めていることを外から確かめるために使う。
export async function GET() {
  const { error } = await supabaseAdmin
    .from("tiktok_accounts")
    .select("open_id", { count: "exact", head: true });

  return NextResponse.json({
    ok: !error,
    serverKey: hasServiceKey, // サーバー専用キーが設定されているか
    db: error ? "error" : "ok", // サーバーからDBを読めるか
  });
}
