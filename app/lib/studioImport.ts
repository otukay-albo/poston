// TikTok Studio からエクスポートしたCSV（Overview / Content）の
// 解析・保存を行うヘルパー。テスト段階のため保存先はブラウザ(localStorage)。
// 本採用が決まったらSupabaseへ移行する。

export interface StudioOverviewRow {
  date: string; // YYYY-MM-DD
  video_views: number;
  profile_views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface StudioContentRow {
  title: string;
  link: string; // 動画URL（重複判定キー）
  post_date: string | null; // YYYY-MM-DD
  views: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface StudioData {
  overview: StudioOverviewRow[];
  content: StudioContentRow[];
  imported_at: string;
}

const KEY = "poston_studio_data";

// ---- CSVパーサ（引用符内のカンマ・改行・""エスケープに対応）----
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n") {
        row.push(field); field = "";
        if (row.some((f) => f.trim() !== "")) rows.push(row);
        row = [];
      } else if (c !== "\r") field += c;
    }
  }
  row.push(field);
  if (row.some((f) => f.trim() !== "")) rows.push(row);
  return rows;
}

// ---- 日付パース（"July 19" 形式。年が無いため未来日なら前年と推定）----
const MONTHS: Record<string, number> = {
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6,
  july: 7, august: 8, september: 9, october: 10, november: 11, december: 12,
};

export function parseStudioDate(s: string): string | null {
  const m = s.trim().match(/^([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?$/);
  if (!m) return null;
  const month = MONTHS[m[1].toLowerCase()];
  if (!month) return null;
  const day = Number(m[2]);
  let year = m[3] ? Number(m[3]) : new Date().getFullYear();
  if (!m[3]) {
    const candidate = new Date(year, month - 1, day);
    if (candidate.getTime() > Date.now() + 86400000) year -= 1; // 未来日→前年
  }
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}`;
}

const num = (s: string | undefined) => {
  const v = Number((s ?? "").replace(/[",\s]/g, ""));
  return Number.isFinite(v) ? v : 0;
};

// ---- CSVの種類判定＋変換 ----
export type ParseResult =
  | { type: "overview"; rows: StudioOverviewRow[] }
  | { type: "content"; rows: StudioContentRow[] }
  | { type: "error"; message: string };

export function parseStudioCSV(text: string): ParseResult {
  const table = parseCSV(text);
  if (table.length < 2) return { type: "error", message: "データ行がありません" };
  const header = table[0].map((h) => h.trim().toLowerCase());

  // Overview.csv: Date, Video Views, Profile Views, Likes, Comments, Shares
  if (header.includes("profile views")) {
    const idx = (name: string) => header.indexOf(name);
    const rows: StudioOverviewRow[] = [];
    for (const r of table.slice(1)) {
      const date = parseStudioDate(r[idx("date")] ?? "");
      if (!date) continue;
      rows.push({
        date,
        video_views: num(r[idx("video views")]),
        profile_views: num(r[idx("profile views")]),
        likes: num(r[idx("likes")]),
        comments: num(r[idx("comments")]),
        shares: num(r[idx("shares")]),
      });
    }
    return { type: "overview", rows };
  }

  // Content.csv: Time, Video title, Video link, Post time, Total likes, Total comments, Total shares, Total views
  if (header.includes("video title")) {
    const idx = (name: string) => header.indexOf(name);
    const rows: StudioContentRow[] = [];
    for (const r of table.slice(1)) {
      const link = (r[idx("video link")] ?? "").trim();
      if (!link) continue;
      rows.push({
        title: (r[idx("video title")] ?? "").trim(),
        link,
        post_date: parseStudioDate(r[idx("post time")] ?? ""),
        views: num(r[idx("total views")]),
        likes: num(r[idx("total likes")]),
        comments: num(r[idx("total comments")]),
        shares: num(r[idx("total shares")]),
      });
    }
    return { type: "content", rows };
  }

  return { type: "error", message: "TikTok StudioのOverview/ContentのCSVではないようです（列名を確認してください）" };
}

// ---- 保存（アカウント別・重複はマージ）----
function loadAll(): Record<string, StudioData> {
  if (typeof window === "undefined") return {};
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}");
    return v && typeof v === "object" ? v : {};
  } catch {
    return {};
  }
}

export function loadStudioData(open_id: string): StudioData | null {
  return loadAll()[open_id] || null;
}

export function mergeStudioData(open_id: string, parsed: ParseResult): StudioData | null {
  if (parsed.type === "error") return null;
  const all = loadAll();
  const cur: StudioData = all[open_id] || { overview: [], content: [], imported_at: "" };

  if (parsed.type === "overview") {
    const map = new Map(cur.overview.map((r) => [r.date, r]));
    parsed.rows.forEach((r) => map.set(r.date, r)); // 同日付は新しい取り込みで上書き
    cur.overview = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  } else {
    const map = new Map(cur.content.map((r) => [r.link, r]));
    parsed.rows.forEach((r) => map.set(r.link, r)); // 同動画は新しい取り込みで上書き
    cur.content = Array.from(map.values()).sort((a, b) => (b.post_date || "").localeCompare(a.post_date || ""));
  }
  cur.imported_at = new Date().toISOString();
  all[open_id] = cur;
  localStorage.setItem(KEY, JSON.stringify(all));
  return cur;
}

export function clearStudioData(open_id: string): void {
  const all = loadAll();
  delete all[open_id];
  localStorage.setItem(KEY, JSON.stringify(all));
}
