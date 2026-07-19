"use client";

import { useEffect, useState } from "react";
import { laClockString, laDateLabel } from "../lib/latime";

// ロサンゼルス現在時刻をライブ表示する時計
export default function LaClock({ className = "" }: { className?: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  if (!now) return null; // SSRとのhydration不一致を避ける

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
