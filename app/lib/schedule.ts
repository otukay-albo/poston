import { getTeamKey } from "./tiktokToken";

// ===== メモ（ブラウザ localStorage に保存・自動投稿はされない） =====
// 動画がまだ無い段階の投稿計画などを書き留めるためのもの。
// 時刻になると自動投稿される「予約」は、このファイル後半のサーバー版で扱う。

export type ScheduleStatus = "予約" | "下書き" | "投稿済み";

export interface ScheduledPost {
  id: string;
  open_id: string; // どのアカウントの投稿か
  account_name?: string; // 表示用の名前スナップショット
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  title: string; // キャプション
  status: ScheduleStatus;
}

const KEY = "poston_schedule";

export function listSchedule(): ScheduledPost[] {
  if (typeof window === "undefined") return [];
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? (v as ScheduledPost[]) : [];
  } catch {
    return [];
  }
}

function persist(list: ScheduledPost[]): void {
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function addSchedule(p: Omit<ScheduledPost, "id">): void {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now()) + Math.random().toString(16).slice(2);
  persist([...listSchedule(), { ...p, id }]);
}

export function updateSchedule(id: string, patch: Partial<ScheduledPost>): void {
  persist(listSchedule().map((s) => (s.id === id ? { ...s, ...patch } : s)));
}

export function removeSchedule(id: string): void {
  persist(listSchedule().filter((s) => s.id !== id));
}

// ===== サーバー側の予約（時刻になると自動投稿されるもの） =====
// 上のlocalStorage版は「メモ」として残し、自動投稿の予約はこちらで扱う。


export type AutoStatus = "予約" | "投稿済み" | "失敗";

export interface AutoPost {
  id: string;
  open_id: string;
  account_name: string | null;
  run_at: string; // UTC（ISO）
  title: string;
  privacy_level: string;
  status: AutoStatus;
  error: string | null;
  attempts: number;
  video_size: number | null;
  posted_at: string | null;
}

export async function fetchAutoPosts(): Promise<{ ok: boolean; posts: AutoPost[]; error?: string; noKey?: boolean }> {
  const key = getTeamKey();
  if (!key) return { ok: false, posts: [], noKey: true };
  try {
    const res = await fetch("/api/schedule", { headers: { "x-team-key": key } });
    const data = await res.json();
    if (!res.ok) return { ok: false, posts: [], error: data.error || `取得に失敗しました (${res.status})` };
    return { ok: true, posts: (data.posts || []) as AutoPost[] };
  } catch (e) {
    return { ok: false, posts: [], error: e instanceof Error ? e.message : String(e) };
  }
}

export async function cancelAutoPost(id: string): Promise<{ ok: boolean; error?: string }> {
  const key = getTeamKey();
  if (!key) return { ok: false, error: "チーム同期が設定されていません" };
  try {
    const res = await fetch("/api/schedule", {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-team-key": key },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || `削除に失敗しました (${res.status})` };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
