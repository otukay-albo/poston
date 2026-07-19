// 予約投稿の保存・取得（現状はブラウザ localStorage に保存）。
// ※自動投稿の実行はTikTok審査(Content Posting API)の承認後にサーバー側で実装する。
//   現段階では「予約の作成・可視化」までを担う。

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
