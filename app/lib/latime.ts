// ロサンゼルス（America/Los_Angeles）時間のユーティリティ。
// 予約・投稿の基準時刻をLAに統一するために使用する。

export const LA_TZ = "America/Los_Angeles";

function laParts(date: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const g = (t: string) => parts.find((x) => x.type === t)?.value ?? "";
  return {
    year: Number(g("year")),
    month: Number(g("month")) - 1, // 0-11
    day: Number(g("day")),
    hour: g("hour"),
    minute: g("minute"),
    second: g("second"),
  };
}

// LAの「今日」の年月日
export function laTodayYMD(): { year: number; month: number; day: number } {
  const { year, month, day } = laParts();
  return { year, month, day };
}

// 予約フォームの初期値（LAの現在日時）
export function laDefaultDateTime(): { date: string; time: string } {
  const { year, month, day, hour, minute } = laParts();
  const pad = (n: number) => String(n).padStart(2, "0");
  return { date: `${year}-${pad(month + 1)}-${pad(day)}`, time: `${hour}:${minute}` };
}

// 表示用の時計文字列 HH:MM:SS
export function laClockString(date: Date = new Date()): string {
  const { hour, minute, second } = laParts(date);
  return `${hour}:${minute}:${second}`;
}

// 表示用の日付ラベル（例: Mon, Jul 17）
export function laDateLabel(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: LA_TZ,
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
}

// 表示用の日本語日付ラベル（例: 7/19(日)）
export function laDateLabelJa(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: LA_TZ,
    month: "numeric",
    day: "numeric",
    weekday: "short",
  }).format(date);
}
