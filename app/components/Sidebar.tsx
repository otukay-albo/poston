"use client";

import { useEffect, useState } from "react";
import AccountAvatar from "./AccountAvatar";
import {
  listAccounts, getStoredToken, switchAccount, removeAccount,
  getTeamKey, setTeamKey, clearTeamKey, syncAccountsFromServer,
  type StoredToken,
} from "../lib/tiktokToken";

export type Page = "dashboard" | "analytics" | "analysis" | "post" | "calendar" | "import" | "help" | "home";

// 予約カレンダーは「投稿」内タブ、傾向分析は「アナリティクス」内タブに統合。
// データ取り込み(/import)はテスト保留中のためナビ非表示（URL直打ちで利用可）。
const NAV: { page: Page; href: string; label: string; icon: string }[] = [
  { page: "dashboard", href: "/dashboard", label: "ダッシュボード", icon: "M3 10.5 12 3l9 7.5M5 9.5V20h14V9.5" },
  { page: "post", href: "/post", label: "投稿", icon: "M12 5v14M5 12h14" },
  { page: "analytics", href: "/analytics", label: "アナリティクス", icon: "M4 20V4M4 20h16M7.5 12v5M13.5 8v9" },
  { page: "help", href: "/help", label: "ヘルプ / 使い方", icon: "M12 21a9 9 0 1 1 0-18 9 9 0 0 1 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7M12 17h.01" },
];

export default function Sidebar({ current }: { current?: Page }) {
  const [dark, setDark] = useState(true);
  const [accounts, setAccounts] = useState<StoredToken[]>([]);
  const [activeId, setActiveId] = useState("");

  const [teamEnabled, setTeamEnabled] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    setDark(saved !== "light");
    setAccounts(listAccounts());
    setActiveId(getStoredToken()?.open_id ?? "");

    // チーム同期が有効なら、共有DBのアカウントを取り込んで一覧を更新
    if (getTeamKey()) {
      setTeamEnabled(true);
      syncAccountsFromServer().then((r) => {
        if (r.ok) {
          setAccounts(listAccounts());
          setActiveId(getStoredToken()?.open_id ?? "");
        } else if (r.error) {
          setSyncMsg(`同期エラー: ${r.error}`);
        }
      });
    }
  }, []);

  const enableTeamSync = async () => {
    const key = window.prompt("チームキーを入力してください（管理者から共有されたもの）");
    if (!key || !key.trim()) return;
    setTeamKey(key.trim());
    setSyncMsg("同期中...");
    const r = await syncAccountsFromServer();
    if (r.ok) {
      setTeamEnabled(true);
      setSyncMsg("");
      setAccounts(listAccounts());
      setActiveId(getStoredToken()?.open_id ?? "");
    } else {
      clearTeamKey();
      setSyncMsg(`エラー: ${r.error}`);
    }
  };

  const disableTeamSync = () => {
    clearTeamKey();
    setTeamEnabled(false);
    setSyncMsg("");
  };

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
    <aside className="w-48 shrink-0 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-black flex flex-col gap-5 p-3 sticky top-0 h-screen overflow-y-auto">
      {/* ロゴ */}
      <a href="/dashboard" className="flex items-center gap-3 px-2 pt-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* 白背景でも輪郭が見えるよう枠線をつける */}
        <img src="/logo.png" alt="Poston" className="w-9 h-9 rounded-xl border border-gray-200 dark:border-gray-700" />
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
              <AccountAvatar src={a.avatar_url} name={a.display_name || a.open_id} size={24} />
              <span className="text-sm flex-1 min-w-0 truncate">
                {a.display_name || a.open_id.slice(0, 8)}
              </span>
              {a.open_id === activeId && <span className="text-[10px] text-green-500">●</span>}
              <button
                onClick={(e) => handleRemove(e, a.open_id)}
                className="text-[10px] text-gray-400 hover:text-red-500 whitespace-nowrap shrink-0"
              >
                ログアウト
              </button>
            </div>
          ))}
          <a href="/" className="block px-3 py-2 mt-1 text-sm text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition">
            ＋ アカウントを追加
          </a>
        </div>
      )}

      {/* チーム同期 */}
      <div className={`border-t border-gray-200 dark:border-gray-800 pt-2 ${accounts.length > 0 ? "" : "mt-auto"}`}>
        {teamEnabled ? (
          <div className="px-3 py-1 text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-between gap-2">
            <span title="接続済みアカウントを共有DBと同期中">🔗 チーム同期: 有効</span>
            <button onClick={disableTeamSync} className="underline hover:text-black dark:hover:text-white">解除</button>
          </div>
        ) : (
          <button
            onClick={enableTeamSync}
            className="w-full text-left px-3 py-2 rounded-lg text-[12px] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white transition"
            title="チームキーを入力すると、接続済みアカウントをチームで共有できます"
          >
            🔗 チーム同期を設定
          </button>
        )}
        {syncMsg && <p className="px-3 pb-1 text-[10px] text-yellow-600 dark:text-yellow-400">{syncMsg}</p>}
      </div>

      {/* テーマ切替 */}
      <button
        onClick={toggleTheme}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-900 hover:text-black dark:hover:text-white transition"
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
