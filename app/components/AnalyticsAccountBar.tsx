"use client";

import { useEffect, useState } from "react";
import { listAccounts, getStoredToken, setAccountAnalyticsName, type StoredToken } from "../lib/tiktokToken";

const ALL = "__ALL__";

// ログイン済みアカウントの中からプルダウンで選択し、その分析を表示する。
// 「全アカウント（合計）」を選ぶと、分析データ名が設定済みの全アカウントを合算対象にする。
// 分析データ(Supabase)のアカウント名はTikTok名と異なるため、
// 未設定なら一度だけ「分析データ名」を紐づけてもらう。
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

  const box = "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl";

  if (accounts.length === 0) {
    return (
      <div className={`${box} p-5 mb-6 text-sm text-gray-600 dark:text-gray-300`}>
        分析するには、対象のアカウントでログインしてください。
        <a href="/" className="underline ml-1 text-black dark:text-white">ログイン</a>
      </div>
    );
  }

  return (
    <div className={`${box} px-5 py-4 mb-6`}>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm text-gray-500 dark:text-gray-400">アカウント</label>
        <select
          value={openId}
          onChange={(e) => changeAccount(e.target.value)}
          className="bg-white dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
        >
          {accounts.length > 1 && <option value={ALL}>全アカウント（合計）</option>}
          {accounts.map((a) => (
            <option key={a.open_id} value={a.open_id}>{a.display_name || a.open_id.slice(0, 8)}</option>
          ))}
        </select>
        {openId !== ALL && selected?.analytics_name && !editing && (
          <span className="text-xs text-gray-400 dark:text-gray-500">
            分析データ名: <span className="text-gray-600 dark:text-gray-300">{selected.analytics_name}</span>
            <button
              onClick={() => { setInput(selected.analytics_name || ""); setEditing(true); }}
              className="underline ml-2 hover:text-black dark:hover:text-white"
            >
              変更
            </button>
          </span>
        )}
      </div>

      {openId === ALL && (
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          {mapped.length > 0 && (
            <p>
              集計対象: {mapped.map((a) => a.display_name || a.analytics_name).join("、")}
            </p>
          )}
          {unmapped.length > 0 && (
            <p className="text-yellow-600 dark:text-yellow-400">
              ⚠ 分析データ名が未設定のため集計対象外: {unmapped.map((a) => a.display_name || a.open_id.slice(0, 8)).join("、")}
              （個別に選択して設定してください）
            </p>
          )}
          {mapped.length === 0 && (
            <p className="text-yellow-600 dark:text-yellow-400">
              どのアカウントも分析データ名が未設定です。まず個別のアカウントを選択して設定してください。
            </p>
          )}
        </div>
      )}

      {editing && openId !== ALL && (
        <div className="mt-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            このアカウントの<span className="text-black dark:text-white">分析データ名</span>を設定してください（集計スプレッドシート等で使っている名前。例: yuki_beauty）。
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
      )}
    </div>
  );
}
