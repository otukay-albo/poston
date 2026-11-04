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

// ロサンゼルス時間の「日付 + 時刻」を、実際のUTC時刻（ISO文字列）に変換する。
// 予約投稿はLA時間で入力するが、サーバーはUTCで判定するため。
// 夏時間(PDT/PST)の切り替わりも、その日のLAのオフセットを実測して吸収する。
export function laToUTC(date: string, time: string): string {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);

  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: LA_TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  });

  // ある瞬間において、LAがUTCから何ミリ秒遅れているか
  const offsetAt = (instant: number): number => {
    const p = Object.fromEntries(
      fmt.formatToParts(new Date(instant)).filter((x) => x.type !== "literal").map((x) => [x.type, x.value])
    ) as Record<string, string>;
    const shown = Date.UTC(
      Number(p.year), Number(p.month) - 1, Number(p.day),
      Number(p.hour) % 24, Number(p.minute), Number(p.second)
    );
    return instant - shown;
  };

  const asUTC = Date.UTC(y, m - 1, d, hh, mm, 0);
  // 1回目の概算では、夏時間の切替当日にオフセットが1時間ずれることがある。
  // 求めた時刻で再度オフセットを測り直して補正する。
  const guess = asUTC + offsetAt(asUTC);
  return new Date(asUTC + offsetAt(guess)).toISOString();
}
