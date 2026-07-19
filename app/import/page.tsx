"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import AppShell from "../components/AppShell";
import { listAccounts, getStoredToken, type StoredToken } from "../lib/tiktokToken";
import {
  parseStudioCSV,
  mergeStudioData,
  loadStudioData,
  clearStudioData,
  type StudioData,
} from "../lib/studioImport";

export default function ImportPage() {
  const [accounts, setAccounts] = useState<StoredToken[]>([]);
  const [openId, setOpenId] = useState("");
  const [data, setData] = useState<StudioData | null>(null);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const list = listAccounts();
    setAccounts(list);
    const initial = getStoredToken()?.open_id || list[0]?.open_id || "";
    setOpenId(initial);
    if (initial) setData(loadStudioData(initial));
  }, []);

  const changeAccount = (id: string) => {
    setOpenId(id);
    setMessage("");
    setData(loadStudioData(id));
  };

  const handleFiles = async (files: FileList | File[]) => {
    if (!openId) return;
    const results: string[] = [];
    for (const file of Array.from(files)) {
      const text = await file.text();
      const parsed = parseStudioCSV(text);
      if (parsed.type === "error") {
        results.push(`❌ ${file.name}: ${parsed.message}`);
        continue;
      }
      const merged = mergeStudioData(openId, parsed);
      if (merged) {
        setData(merged);
        results.push(
          parsed.type === "overview"
            ? `✅ ${file.name}: 日別データ ${parsed.rows.length}日分を取り込みました`
            : `✅ ${file.name}: 動画データ ${parsed.rows.length}本を取り込みました`
        );
      }
    }
    setMessage(results.join("\n"));
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files);
  };

  const handleClear = () => {
    if (!openId) return;
    clearStudioData(openId);
    setData(null);
    setMessage("取り込みデータを削除しました");
  };

  const accName = accounts.find((a) => a.open_id === openId)?.display_name || "";

  const chartData = useMemo(
    () =>
      (data?.overview || []).map((r) => ({
        date: r.date.slice(5).replace("-", "/"),
        再生数: r.video_views,
        プロフィール閲覧: r.profile_views,
      })),
    [data]
  );

  return (
    <AppShell current="import" title="データ取り込み">
      <div className="flex-1 px-6 md:px-10 py-8 max-w-5xl mx-auto w-full">
        <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300 rounded-xl px-4 py-3 text-sm mb-6">
          <span>🧪</span>
          <span>
            TikTok StudioのCSV（Overview / Content）を取り込むテスト機能です。TikTok Studio →「分析」→ 右上の「データをダウンロード」で書き出したCSVを、そのままドラッグ＆ドロップしてください。
            現在はこのブラウザに保存されます（本採用時にデータベース保存へ移行予定）。
            ※保存数・平均視聴時間はStudioの書き出しに含まれないため取り込めません。
          </span>
        </div>

        {/* アカウント選択 */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <label className="text-sm text-gray-500 dark:text-gray-400">取り込み先アカウント</label>
          <select
            value={openId}
            onChange={(e) => changeAccount(e.target.value)}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm"
          >
            {accounts.map((a) => (
              <option key={a.open_id} value={a.open_id}>{a.display_name || a.open_id.slice(0, 8)}</option>
            ))}
          </select>
          {data && (
            <button onClick={handleClear} className="text-xs text-red-500 underline hover:text-red-600">
              このアカウントの取り込みデータを削除
            </button>
          )}
        </div>

        {/* ドロップゾーン */}
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition mb-4 ${
            dragging
              ? "border-black dark:border-white bg-gray-50 dark:bg-gray-900"
              : "border-gray-300 dark:border-gray-700 hover:border-gray-500 dark:hover:border-gray-400"
          }`}
        >
          <p className="text-3xl mb-3">📂</p>
          <p className="font-bold mb-1">CSVファイルをここにドラッグ＆ドロップ</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Overview.csv / Content.csv（複数まとめてOK）・クリックで選択も可
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); e.target.value = ""; }}
          />
        </div>

        {message && (
          <pre className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-xs whitespace-pre-wrap mb-6">{message}</pre>
        )}

        {/* 取り込み結果 */}
        {data && (
          <>
            {data.overview.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 mb-6">
                <h2 className="font-bold text-sm mb-1">日別推移（Studio）— {accName}</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  {data.overview.length}日分 ・ プロフィール閲覧数はStudio限定の指標です
                </p>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ccc" className="dark:[stroke:#333]" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="再生数" stroke="#6366f1" strokeWidth={2} dot={{ r: 2.5 }} />
                    <Line type="monotone" dataKey="プロフィール閲覧" stroke="#E0567F" strokeWidth={2} dot={{ r: 2.5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {data.content.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden mb-6">
                <div className="px-5 py-3 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="font-bold text-sm">動画データ（Studio）— {data.content.length}本</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-left">
                        <th className="px-4 py-2.5">タイトル</th>
                        <th className="px-4 py-2.5 whitespace-nowrap">投稿日</th>
                        <th className="px-4 py-2.5 text-right">再生数</th>
                        <th className="px-4 py-2.5 text-right">いいね</th>
                        <th className="px-4 py-2.5 text-right">コメント</th>
                        <th className="px-4 py-2.5 text-right">共有</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.content.map((v) => (
                        <tr key={v.link} className="border-b border-gray-100 dark:border-gray-800/50">
                          <td className="px-4 py-2.5 max-w-sm">
                            <a href={v.link} target="_blank" rel="noreferrer" className="hover:underline">
                              <span className="line-clamp-1">{v.title || "（タイトルなし）"}</span>
                            </a>
                          </td>
                          <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">{v.post_date || "-"}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{v.views.toLocaleString("ja-JP")}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{v.likes.toLocaleString("ja-JP")}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{v.comments.toLocaleString("ja-JP")}</td>
                          <td className="px-4 py-2.5 text-right tabular-nums">{v.shares.toLocaleString("ja-JP")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-400 dark:text-gray-600">
              最終取り込み: {data.imported_at ? new Date(data.imported_at).toLocaleString("ja-JP") : "-"}
              ・同じ日付/動画は新しい取り込みで上書きされます（過去分は蓄積され、Studioの60日制限を超えて保存できます）
            </p>
          </>
        )}
      </div>
    </AppShell>
  );
}
