"use client";

import { useEffect, useState } from "react";
import { laClockString, laDateLabel, laDateLabelJa } from "../lib/latime";

// ロサンゼルス現在時刻をライブ表示する時計
export default function LaClock({ className = "", size = "sm" }: { className?: string; size?: "sm" | "lg" }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) return null; // SSRとのhydration不一致を避ける

  if (size === "lg") {
    return (
      <span className={`inline-flex flex-col items-center ${className}`} title="ロサンゼルス時間">
        <span className="text-[10px] font-medium tracking-[0.25em] text-gray-400 dark:text-gray-500">
          LOS ANGELES
        </span>
        <span className="text-2xl font-bold tabular-nums leading-tight text-black dark:text-white">
          {laDateLabelJa(now)} {laClockString(now)}
        </span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 tabular-nums ${className}`}
      title="ロサンゼルス時間"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
      LA {laDateLabel(now)} {laClockString(now)}
    </span>
  );
}
