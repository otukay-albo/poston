"use client";

import { useEffect, useState } from "react";
import { getStoredToken, setAccountAnalyticsName } from "../lib/tiktokToken";

// サイドバーで選択中のアカウントを分析ページに反映するバー。
// 分析データ(Supabase)のアカウント名はTikTok名と異なるため、
// 未設定なら一度だけ「分析データ名」を紐づけてもらう。
// 解決した分析名を onResolve で親に渡す（未解決なら null）。
export default function AnalyticsAccountBar({ onResolve }: { onResolve: (name: string | null) => void }) {
  const [account, setAccount] = useState<{ open_id: string; display_name?: string } | null>(null);
  const [name, setName] = useState("");
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = getStoredToken();
    if (!t) {
      setReady(true);
      onResolve(null);
      return;
    }
    setAccount({ open_id: t.open_id, display_name: t.display_name });
    if (t.analytics_name) {
      setName(t.analytics_name);
      onResolve(t.analytics_name);
    } else {
      setEditing(true);
      onResolve(null);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    const v = input.trim();
    if (!v || !account) return;
    setAccountAnalyticsName(account.open_id, v);
    setName(v);
    setEditing(false);
    onResolve(v);
  };

  if (!ready) return null;

  const box = "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl";

  if (!account) {
    return (
      <div className={`${box} p-5 mb-6 text-sm text-gray-600 dark:text-gray-300`}>
        分析するには、対象のアカウントでログインしてください。
        <a href="/" className="underline ml-1 text-black dark:text-white">ログイン</a>
      </div>
    );
  }

  const accLabel = account.display_name || account.open_id.slice(0, 8);

  if (editing) {
    return (
      <div className={`${box} p-5 mb-6`}>
        <p className="text-sm font-medium mb-1">
          アカウント「{accLabel}」の<span className="text-black dark:text-white">分析データ名</span>を設定してください
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          集計スプレッドシート／TikTok Studioで使っているアカウント名を入力（例: yuki_beauty）。一度設定すれば次回から自動で表示されます。
        </p>
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); }}
            placeholder="分析データ名"
            className="flex-1 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
          />
          <button
            onClick={save}
            disabled={!input.trim()}
            className="bg-black dark:bg-white text-white dark:text-black rounded-lg px-5 py-2 text-sm font-bold disabled:opacity-30"
          >
            保存
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${box} px-5 py-3 mb-6 flex items-center justify-between gap-3`}>
      <div className="text-sm">
        <span className="text-gray-500 dark:text-gray-400">分析対象：</span>
        <span className="font-semibold">{accLabel}</span>
        <span className="text-gray-400 dark:text-gray-500 ml-2 text-xs">（分析データ名: {name}）</span>
      </div>
      <button
        onClick={() => { setInput(name); setEditing(true); }}
        className="text-xs text-gray-500 dark:text-gray-400 underline hover:text-black dark:hover:text-white shrink-0"
      >
        変更
      </button>
    </div>
  );
}
