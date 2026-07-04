"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import Header from "../components/Header";

const ACCOUNTS = ["全アカウント", "yuki_beauty", "otayui", "account1", "account2", "account3"];
const REAL_ACCOUNTS = ["yuki_beauty", "otayui", "account1", "account2", "account3"];
const METRICS = [
  { key: "再生数", label: "再生数" },
  { key: "いいね数", label: "いいね" },
  { key: "コメント数", label: "コメント" },
  { key: "シェア数", label: "共有" },
  { key: "エンゲージメント率(%)", label: "エンゲージ率" },
];

interface Row {
  取得日時: string;
  動画ID: string;
  タイトル: string;
  再生数: number;
  いいね数: number;
  コメント数: number;
  シェア数: number;
  "エンゲージメント率(%)": number;
  投稿日時: string;
  "動画時間(秒)": string | number;
}

export default function AnalyticsPage() {
  const [account, setAccount] = useState(ACCOUNTS[0]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [metricIdx, setMetricIdx] = useState(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    setRows([]);
    const targets = account === "全アカウント" ? REAL_ACCOUNTS : [account];
    Promise.all(
      targets.map((a) =>
        fetch(`/api/analytics?account=${a}`)
          .then((r) => r.json())
          .then((data) => (data.error ? [] : data.rows || []))
          .catch(() => [])
      )
    )
      .then((results) => setRows(results.flat()))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [account]);

  const filtered = useMemo(() => {
    const from = new Date(dateFrom.replace(/\//g, "-") + "T00:00:00");
    const to = new Date(dateTo.replace(/\//g, "-") + "T23:59:59");
    return rows.filter((r) => {
      const d = new Date(r.取得日時);
      return d >= from && d <= to;
    });
  }, [rows, dateFrom, dateTo]);

  const latestByVideo = useMemo(() => {
    const map = new Map<string, Row>();
    filtered.forEach((r) => {
      const existing = map.get(r.動画ID);
      if (!existing || new Date(r.取得日時) > new Date(existing.取得日時)) {
        map.set(r.動画ID, r);
      }
    });
    return Array.from(map.values());
  }, [filtered]);

  const summary = useMemo(() => {
    const totalViews = latestByVideo.reduce((s, r) => s + r.再生数, 0);
    const totalLikes = latestByVideo.reduce((s, r) => s + r.いいね数, 0);
    const totalComments = latestByVideo.reduce((s, r) => s + r.コメント数, 0);
    const totalShares = latestByVideo.reduce((s, r) => s + r.シェア数, 0);
    const avgEng = latestByVideo.length
      ? latestByVideo.reduce((s, r) => s + r["エンゲージメント率(%)"], 0) / latestByVideo.length
      : 0;
    const likeRate = totalViews > 0 ? (totalLikes / totalViews) * 100 : 0;
    const shareRate = totalViews > 0 ? (totalShares / totalViews) * 100 : 0;
    return { totalViews, totalLikes, totalComments, totalShares, avgEng, likeRate, shareRate };
  }, [latestByVideo]);

  const chartData = useMemo(() => {
    const metric = METRICS[metricIdx].key as keyof Row;
    const from = new Date(dateFrom.replace(/\//g, "-") + "T00:00:00");
    const to = new Date(dateTo.replace(/\//g, "-") + "T23:59:59");
    const dayMap = new Map<string, number[]>();
    rows.forEach((r) => {
      const d = new Date(r.取得日時);
      if (d < from || d > to) return;
      const dateStr = d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
      if (!dayMap.has(dateStr)) dayMap.set(dateStr, []);
      dayMap.get(dateStr)!.push(Number(r[metric]) || 0);
    });
    return Array.from(dayMap.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, vals]) => ({ date, value: vals.reduce((s, v) => s + v, 0) / vals.length }));
  }, [rows, dateFrom, dateTo, metricIdx]);

  const videoList = useMemo(() => [...latestByVideo].sort((a, b) => b.再生数 - a.再生数), [latestByVideo]);
  const isEngRate = METRICS[metricIdx].key === "エンゲージメント率(%)";

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col">
      <Header current="analytics" />

      <div className="flex-1 px-6 md:px-10 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-wrap gap-4 mb-8">
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm"
          >
            {ACCOUNTS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
          <div className="flex items-center gap-2 text-sm">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2" />
            <span className="text-gray-400">〜</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2" />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 mb-6 text-red-600 dark:text-red-400">
            エラー: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "合計再生数", value: summary.totalViews.toLocaleString("ja-JP"), sub: null },
                { label: "合計いいね", value: summary.totalLikes.toLocaleString("ja-JP"), sub: `いいね率 ${summary.likeRate.toFixed(2)}%` },
                { label: "合計コメント", value: summary.totalComments.toLocaleString("ja-JP"), sub: null },
                { label: "合計共有", value: summary.totalShares.toLocaleString("ja-JP"), sub: `共有率 ${summary.shareRate.toFixed(2)}%` },
                { label: "平均エンゲージ率", value: `${summary.avgEng.toFixed(2)}%`, sub: null },
              ].map((card) => (
                <div key={card.label} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5">
                  <p className="text-gray-500 dark:text-gray-400 text-xs mb-2">{card.label}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                  {card.sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.sub}</p>}
                </div>
              ))}
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 mb-8">
              <div className="flex gap-2 mb-6 flex-wrap">
                {METRICS.map((m, i) => (
                  <button
                    key={m.key}
                    onClick={() => setMetricIdx(i)}
                    className={`px-4 py-1.5 rounded-full text-sm transition ${
                      metricIdx === i
                        ? "bg-black dark:bg-white text-white dark:text-black font-bold"
                        : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ccc" className="dark:[stroke:#333]" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => isEngRate ? `${v.toFixed(1)}%` : v.toLocaleString("ja-JP")} />
                  <Tooltip
                    formatter={(v) => [isEngRate ? `${Number(v).toFixed(2)}%` : Number(v).toLocaleString("ja-JP"), METRICS[metricIdx].label]}
                  />
                  <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                <h2 className="font-bold text-lg">投稿一覧（再生数順）</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                      <th className="text-left px-6 py-3">タイトル</th>
                      <th className="text-right px-4 py-3">再生数</th>
                      <th className="text-right px-4 py-3">いいね</th>
                      <th className="text-right px-4 py-3">いいね率</th>
                      <th className="text-right px-4 py-3">コメント</th>
                      <th className="text-right px-4 py-3">共有</th>
                      <th className="text-right px-4 py-3">共有率</th>
                      <th className="text-right px-4 py-3">エンゲージ率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videoList.map((v) => (
                      <tr key={v.動画ID} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/30 transition">
                        <td className="px-6 py-3 max-w-xs">
                          <div className="flex items-center gap-2">
                            {v.再生数 >= 200000 && (
                              <span className="bg-yellow-400 text-black text-xs font-bold px-2 py-0.5 rounded-full shrink-0">バズ</span>
                            )}
                            <span className="truncate">{v.タイトル || "（タイトルなし）"}</span>
                          </div>
                        </td>
                        <td className="text-right px-4 py-3">{v.再生数.toLocaleString("ja-JP")}</td>
                        <td className="text-right px-4 py-3">{v.いいね数.toLocaleString("ja-JP")}</td>
                        <td className="text-right px-4 py-3 text-gray-500 dark:text-gray-400">{v.再生数 > 0 ? ((v.いいね数 / v.再生数) * 100).toFixed(2) : "0.00"}%</td>
                        <td className="text-right px-4 py-3">{v.コメント数.toLocaleString("ja-JP")}</td>
                        <td className="text-right px-4 py-3">{v.シェア数.toLocaleString("ja-JP")}</td>
                        <td className="text-right px-4 py-3 text-gray-500 dark:text-gray-400">{v.再生数 > 0 ? ((v.シェア数 / v.再生数) * 100).toFixed(2) : "0.00"}%</td>
                        <td className="text-right px-4 py-3">{Number(v["エンゲージメント率(%)"]).toFixed(2)}%</td>
                      </tr>
                    ))}
                    {videoList.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-10 text-gray-400">データがありません</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="border-t border-gray-200 dark:border-gray-800 text-gray-400 text-sm text-center py-6">
        © 2026 Poston
      </footer>
    </main>
  );
}
