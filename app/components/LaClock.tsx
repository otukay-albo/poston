"use client";

import { useEffect, useState } from "react";
import { laClockString, laDateLabel } from "../lib/latime";

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
      <span className={`inline-flex items-baseline gap-2 ${className}`} title="ロサンゼルス時間">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          LA {laDateLabel(now)}
        </span>
        <span className="text-2xl font-bold tabular-nums text-black dark:text-white">{laClockString(now)}</span>
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
