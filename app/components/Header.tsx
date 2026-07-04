"use client";

import { useEffect, useState } from "react";

type Page = "dashboard" | "analytics" | "analysis" | "post" | "home";

export default function Header({ current }: { current?: Page }) {
  const [dark, setDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    setDark(saved !== "light");
  }, []);

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
