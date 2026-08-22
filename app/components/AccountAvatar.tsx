"use client";

import { useEffect, useState } from "react";

// アカウントのアイコン表示。
// TikTokのアバターURLは有効期限があり時間が経つと読めなくなるため、
// 失敗した場合は名前の頭文字を表示するフォールバックを持つ。
export default function AccountAvatar({
  src,
  name,
  size = 24,
  className = "",
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  // srcが変わったらエラー状態をリセット
  useEffect(() => setFailed(false), [src]);

  const initial = (name || "?").trim().charAt(0).toUpperCase();
  const style = { width: size, height: size };

  if (!src || failed) {
    return (
      <span
        style={style}
        className={`shrink-0 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold ${className}`}
        aria-label={name || "アカウント"}
      >
        <span style={{ fontSize: Math.max(10, Math.round(size * 0.45)) }}>{initial}</span>
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name || "アカウント"}
      style={style}
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}
