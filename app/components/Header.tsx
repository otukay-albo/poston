"use client";

import { useEffect, useState } from "react";
import { listAccounts, getStoredToken, switchAccount, removeAccount, type StoredToken } from "../lib/tiktokToken";

type Page = "dashboard" | "analytics" | "analysis" | "post" | "home";

export default function Header({ current }: { current?: Page }) {
  const [dark, setDark] = useState(true);
  const [accounts, setAccounts] = useState<StoredToken[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    setDark(saved !== "light");
    setAccounts(listAccounts());
    setActiveId(getStoredToken()?.open_id ?? "");
  }, []);

  const active = accounts.find((a) => a.open_id === activeId);

  const handleSwitch = (open_id: string) => {
    if (open_id === activeId) {
      setMenuOpen(false);
      return;
    }
    if (switchAccount(open_id)) {
      // アクティブが変わったので、ページを再読込して新しいアカウントのデータを取得
      window.location.reload();
    }
  };

  const handleRemove = (e: React.MouseEvent, open_id: string) => {
    e.stopPropagation();
    removeAccount(open_id);
    const remaining = listAccounts();
    if (remaining.length === 0) {
      window.location.href = "/";
    } else {
      window.location.reload();
    }
  };

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  const link = (page: Page, href: string, label: string) => (
    <a
      href={href}
      className={`text-sm transition ${
        current === page
          ? "text-black dark:text-white font-bold border-b border-black dark:border-white pb-0.5"
          : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
      }`}
    >
      {label}
    </a>
  );

  return (
    <header className="flex items-center justify-between px-8 py-5 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800">
      <a href="/" className="flex items-center gap-3">
        <div className="w-9 h-9 bg-black dark:bg-white rounded-xl flex items-center justify-center">
          <span className="text-white dark:text-black font-bold text-xl">P</span>
        </div>
        <span className="text-black dark:text-white font-bold text-xl tracking-wide">Poston</span>
      </a>
      <div className="flex items-center gap-6">
        <nav className="flex gap-6">
          {link("dashboard", "/dashboard", "ダッシュボード")}
          {link("analytics", "/analytics", "アナリティクス")}
          {link("analysis", "/analysis", "傾向分析")}
          {link("post", "/post", "投稿")}
        </nav>

        {/* アカウント切り替え */}
        {accounts.length > 0 && (
          <div className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="flex items-center gap-2 border border-gray-300 dark:border-gray-700 rounded-full pl-1 pr-3 py-1 hover:border-black dark:hover:border-white transition"
              title="アカウントを切り替え"
            >
              {active?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.avatar_url} alt="" className="w-7 h-7 rounded-full" />
              ) : (
                <span className="w-7 h-7 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">👤</span>
              )}
              <span className="text-sm max-w-[8rem] truncate">{active?.display_name || "アカウント"}</span>
              <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current opacity-60"><path d="M7 10l5 5 5-5z" /></svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-2 z-50">
                <p className="px-4 py-1 text-xs text-gray-400 dark:text-gray-500">アカウント切り替え</p>
                {accounts.map((a) => (
                  <div
                    key={a.open_id}
                    onClick={() => handleSwitch(a.open_id)}
                    className={`flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      a.open_id === activeId ? "font-bold" : ""
                    }`}
                  >
                    {a.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.avatar_url} alt="" className="w-6 h-6 rounded-full" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs">👤</span>
                    )}
                    <span className="text-sm flex-1 truncate">{a.display_name || a.open_id.slice(0, 8)}</span>
                    {a.open_id === activeId && <span className="text-xs text-green-500">●</span>}
                    <button
                      onClick={(e) => handleRemove(e, a.open_id)}
                      className="text-gray-400 hover:text-red-500 text-xs px-1"
                      title="このアカウントを削除"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <a
                  href="/"
                  className="block px-4 py-2 mt-1 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  ＋ アカウントを追加
                </a>
              </div>
            )}
          </div>
        )}

        {/* ダーク/ライト切り替え */}
        <button
          onClick={toggleTheme}
          className="w-9 h-9 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition"
          title={dark ? "ライトモードに切り替え" : "ダークモードに切り替え"}
        >
          {dark ? (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
