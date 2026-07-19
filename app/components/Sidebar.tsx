"use client";

import { useEffect, useState } from "react";
import { listAccounts, getStoredToken, switchAccount, removeAccount, type StoredToken } from "../lib/tiktokToken";

export type Page = "dashboard" | "analytics" | "analysis" | "post" | "calendar" | "import" | "help" | "home";

const NAV: { page: Page; href: string; label: string; icon: string }[] = [
  { page: "dashboard", href: "/dashboard", label: "ダッシュボード", icon: "M3 10.5 12 3l9 7.5M5 9.5V20h14V9.5" },
  { page: "post", href: "/post", label: "投稿", icon: "M12 5v14M5 12h14" },
  { page: "calendar", href: "/calendar", label: "予約カレンダー", icon: "M4 5h16v15H4z M4 9h16 M8 3v4 M16 3v4" },
  { page: "analytics", href: "/analytics", label: "アナリティクス", icon: "M4 20V4M4 20h16M7.5 12v5M13.5 8v9" },
  { page: "analysis", href: "/analysis", label: "傾向分析", icon: "M4 17l5-5 3 3 7-8M4 7v13h16" },
  { page: "import", href: "/import", label: "データ取り込み", icon: "M12 16V4M6 10l6-6 6 6M4 20h16" },
  { page: "help", href: "/help", label: "ヘルプ / 使い方", icon: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01" },
];

export default function Sidebar({ current }: { current?: Page }) {
  const [dark, setDark] = useState(true);
  const [accounts, setAccounts] = useState<StoredToken[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    setDark(saved !== "light");
    setAccounts(listAccounts());
    setActiveId(getStoredToken()?.open_id ?? "");
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const handleSwitch = (open_id: string) => {
    if (open_id !== activeId && switchAccount(open_id)) window.location.reload();
  };

  const handleRemove = (e: React.MouseEvent, open_id: string) => {
    e.stopPropagation();
    removeAccount(open_id);
    if (listAccounts().length === 0) window.location.href = "/";
    else window.location.reload();
  };

  return (
    <aside className="w-60 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex flex-col gap-6 p-4 sticky top-0 h-screen overflow-y-auto">
      {/* ロゴ */}
      <a href="/dashboard" className="flex items-center gap-3 px-2 pt-1">
        <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center">
          <span className="text-white dark:text-black font-bold text-xl">P</span>
        </div>
        <div>
          <div className="font-bold text-lg leading-none">Poston</div>
          <div className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">TikTok運用ダッシュボード</div>
        </div>
      </a>

      {/* ナビ */}
      <nav className="flex flex-col gap-1">
        {NAV.map((n) => {
          const active = current === n.page;
          return (
            <a
              key={n.page}
              href={n.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                active
                  ? "bg-black dark:bg-white text-white dark:text-black font-semibold"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-[18px] h-[18px] shrink-0">
                <path d={n.icon} />
              </svg>
              {n.label}
            </a>
          );
        })}
      </nav>

      {/* アカウント切替 */}
      {accounts.length > 0 && (
        <div className="mt-auto border-t border-gray-200 dark:border-gray-800 pt-3">
          <p className="text-[11px] text-gray-400 dark:text-gray-500 px-3 pb-1">アカウント</p>
          {accounts.map((a) => (
            <div
              key={a.open_id}
              onClick={() => handleSwitch(a.open_id)}
              className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition ${
                a.open_id === activeId ? "bg-gray-100 dark:bg-gray-900" : "hover:bg-gray-100 dark:hover:bg-gray-900"
              }`}
            >
              {a.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.avatar_url} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">👤</span>
              )}
              <span className="text-sm flex-1 truncate">{a.display_name || a.open_id.slice(0, 8)}</span>
              {a.open_id === activeId && <span className="text-[10px] text-green-500">●</span>}
              <button
                onClick={(e) => handleRemove(e, a.open_id)}
                className="text-gray-400 hover:text-red-500 text-xs opacity-0 group-hover:opacity-100 transition"
                title="このアカウントを削除"
              >
                ✕
              </button>
            </div>
          ))}
          <a href="/" className="block px-3 py-2 mt-1 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition">
            ＋ アカウントを追加
          </a>
        </div>
      )}

      {/* テーマ切替 */}
      <button
        onClick={toggleTheme}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white transition ${accounts.length > 0 ? "" : "mt-auto"}`}
      >
        {dark ? (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-current"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" /></svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-none stroke-current" strokeWidth="1.8"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" /></svg>
        )}
        {dark ? "ライトモード" : "ダークモード"}
      </button>
    </aside>
  );
}
