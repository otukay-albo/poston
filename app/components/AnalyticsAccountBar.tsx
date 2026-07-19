"use client";

import { useEffect, useState } from "react";
import { listAccounts, getStoredToken, setAccountAnalyticsName, type StoredToken } from "../lib/tiktokToken";

const ALL = "__ALL__";

// ログイン済みアカウントの中からプルダウンで選択するコンパクトなセレクタ。
// 「全アカウント（合計）」を選ぶと、分析データ名が設定済みの全アカウントを合算対象にする。
// 分析データ(Supabase)のアカウント名はTikTok名と異なるため、未設定なら一度だけ紐づけてもらう。
// 解決した分析名の配列を onResolve で親に渡す（未解決なら null）。
export default function AnalyticsAccountBar({ onResolve }: { onResolve: (names: string[] | null) => void }) {
  const [accounts, setAccounts] = useState<StoredToken[]>([]);
  const [openId, setOpenId] = useState("");
  const [input, setInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(false);

  const resolveFor = (id: string, list: StoredToken[]) => {
    if (id === ALL) {
      const names = list.filter((a) => a.analytics_name).map((a) => a.analytics_name!);
      onResolve(names.length > 0 ? names : null);
      setEditing(false);
      return;
    }
    const acc = list.find((a) => a.open_id === id);
    onResolve(acc?.analytics_name ? [acc.analytics_name] : null);
    setEditing(acc ? !acc.analytics_name : false);
  };

  useEffect(() => {
    const list = listAccounts();
    setAccounts(list);
    const initial = getStoredToken()?.open_id || list[0]?.open_id || "";
    setOpenId(initial);
    resolveFor(initial, list);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = accounts.find((a) => a.open_id === openId) || null;
  const mapped = accounts.filter((a) => a.analytics_name);
  const unmapped = accounts.filter((a) => !a.analytics_name);

  const changeAccount = (id: string) => {
    setOpenId(id);
    setInput("");
    resolveFor(id, listAccounts());
  };

  const save = () => {
    const v = input.trim();
    if (!v || !openId || openId === ALL) return;
    setAccountAnalyticsName(openId, v);
    setAccounts(listAccounts());
    onResolve([v]);
    setEditing(false);
  };

  if (!ready) return null;

  if (accounts.length === 0) {
    return (
      <span className="text-sm text-gray-600 dark:text-gray-300">
        分析するにはログインしてください。
        <a href="/" className="underline ml-1 text-black dark:text-white">ログイン</a>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <select
        value={openId}
        onChange={(e) => changeAccount(e.target.value)}
        className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm"
      >
        {accounts.length > 1 && <option value={ALL}>全アカウント（合計）</option>}
        {accounts.map((a) => (
          <option key={a.open_id} value={a.open_id}>{a.display_name || a.open_id.slice(0, 8)}</option>
        ))}
      </select>

      {openId !== ALL && selected?.analytics_name && !editing && (
        <span className="text-[11px] text-gray-400 dark:text-gray-500" title="分析データ名">
          {selected.analytics_name}
          <button
            onClick={() => { setInput(selected.analytics_name || ""); setEditing(true); }}
            className="underline ml-1.5 hover:text-black dark:hover:text-white"
          >
            変更
          </button>
        </span>
      )}

      {openId === ALL && unmapped.length > 0 && mapped.length > 0 && (
        <span className="text-[11px] text-yellow-600 dark:text-yellow-400">
          ⚠ 分析データ名が未設定のため対象外: {unmapped.map((a) => a.display_name || a.open_id.slice(0, 8)).join("、")}
        </span>
      )}
      {openId === ALL && mapped.length === 0 && (
        <span className="text-[11px] text-yellow-600 dark:text-yellow-400">
          分析データ名が未設定です。個別のアカウントを選択して設定してください。
        </span>
      )}

      {editing && openId !== ALL && (
        <span className="inline-flex items-center gap-1.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") save(); }}
            placeholder="分析データ名（例: yuki_beauty）"
            title="集計スプレッドシート等で使っているアカウント名"
            className="w-52 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
          />
          <button
            onClick={save}
            disabled={!input.trim()}
            className="bg-black dark:bg-white text-white dark:text-black rounded-lg px-3.5 py-1.5 text-sm font-bold disabled:opacity-30"
          >
            保存
          </button>
        </span>
      )}
    </div>
  );
}
