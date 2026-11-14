import { supabaseAdmin } from "./supabaseAdmin";

// 分析用に「動画ごとの最新スナップショット」を取り出す。
//
// video_stats には収集のたびに全動画の行が追加されるため、行数は増え続ける。
// 以前は「古い順に先頭1000行」を返していたので、行数が1000を超えると
// 新しい収集結果が切り捨てられ、画面の数値が古いまま止まってしまった。

export interface StatRow {
  account_name: string;
  video_id: string;
  title: string | null;
  view_count: number | null;
  like_count: number | null;
  comment_count: number | null;
  share_count: number | null;
  engagement_rate: number | null;
  posted_at: string | null;
  duration_seconds: number | null;
  fetched_at: string;
}

export async function latestStats(account: string): Promise<{ rows: StatRow[]; error?: string }> {
  // 1) DB側で動画ごとに最新1件へ絞る（正確で転送量も少ない）。
  //    関数が未作成の場合や時間がかかりすぎる場合は 2) に切り替える。
  try {
    const { data, error } = await supabaseAdmin
      .rpc("latest_video_stats", { p_account: account })
      .abortSignal(AbortSignal.timeout(8000));
    if (!error && Array.isArray(data)) return { rows: data as StatRow[] };
  } catch {
    // 2) へ
  }

  // 2) 新しい順に1000行を取り、その中で動画ごとの最新を拾う。
  //    直近の収集結果は必ず含まれるので、数値が古いまま止まることはない。
  const { data, error } = await supabaseAdmin
    .from("video_stats")
    .select("*")
    .eq("account_name", account)
    .order("fetched_at", { ascending: false })
    .limit(1000);
  if (error) return { rows: [], error: error.message };

  const latest = new Map<string, StatRow>();
  for (const r of (data || []) as StatRow[]) {
    if (!latest.has(r.video_id)) latest.set(r.video_id, r);
  }
  return { rows: Array.from(latest.values()) };
}
