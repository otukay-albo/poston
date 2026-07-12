"use client";

import Sidebar, { type Page } from "./Sidebar";

// サイドバー付きのアプリ共通レイアウト。
// title を渡すと上部バーにページ名を表示する。
export default function AppShell({
  current,
  title,
  actions,
  children,
}: {
  current?: Page;
  title?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex bg-white dark:bg-black text-black dark:text-white">
      <Sidebar current={current} />
      <div className="flex-1 min-w-0 flex flex-col">
        {title && (
          <header className="h-16 shrink-0 flex items-center justify-between gap-4 px-6 md:px-8 border-b border-gray-200 dark:border-gray-800 sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur z-10">
            <h1 className="font-bold text-lg truncate">{title}</h1>
            {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
          </header>
        )}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
