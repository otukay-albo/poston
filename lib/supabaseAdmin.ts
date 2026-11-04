import { createClient } from "@supabase/supabase-js";

// サーバー専用のSupabaseクライアント。
// 予約投稿の動画は非公開バケットに置くため、匿名キーでは読み書きできない。
// SUPABASE_SERVICE_ROLE_KEY はブラウザに配信されない（NEXT_PUBLIC_ を付けないこと）。
// 未設定の場合は匿名キーにフォールバックするが、その場合バケット操作は失敗する。
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabaseAdmin = createClient(url, serviceKey || anonKey, {
  auth: { persistSession: false },
});

export const hasServiceKey = !!serviceKey;
