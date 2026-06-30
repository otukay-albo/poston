"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const ACCOUNTS = ["全アカウント", "yuki_beauty", "otayui", "account1", "account2", "account3"];
const REAL_ACCOUNTS = ["yuki_beauty", "otayui", "account1", "account2", "account3"];
const METRICS = [
  { key: "再生数", label: "再生数", unit: "" },
  { key: "いいね数", label: "いいね", unit: "" },
  { key: "コメント数", label: "コメント", unit: "" },
  { key: "シェア数", label: "シェア", unit: "" },
  { key: "エンゲージメント率(%)", label: "エンゲージ率", unit: "%" },
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

function pct(val: number) {
  if (!isFinite(val)) return "-";
  const sign = val >= 0 ? "▲+" : "▼";
  return `${sign}${Math.abs(val).toFixed(1)}%`;
}

function pctColor(val: number) {
  if (!isFinite(val)) return "text-gray-400";
  return val >= 0 ? "text-green-400" : "text-red-400";
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

  // 期間内の行に絞る
  const filtered = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    return rows.filter((r) => {
      const d = new Date(r.取得日時);
      return d >= from && d <= to;
    });
  }, [rows, dateFrom, dateTo]);

  // 最新スナップショット（動画IDごとに最新の取得日時の行）
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

  // サマリー（前半/後半比較）
  const summary = useMemo(() => {
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    const mid = new Date((from.getTime() + to.getTime()) / 2);

    const second = rows.filter((r) => {
      const d = new Date(r.取得日時);
      return d >= mid && d <= to;
    });
    const first = rows.filter((r) => {
      const d = new Date(r.取得日時);
      return d >= from && d < mid;
    });

    const sum = (arr: Row[], key: keyof Row) =>
      arr.reduce((s, r) => s + (Number(r[key]) || 0), 0);
    const avg = (arr: Row[], key: keyof Row) =>
      arr.length ? sum(arr, key) / arr.length : 0;

    const totalViews2 = sum(second, "再生数");
    const totalViews1 = sum(first, "再生数");
    const totalLikes2 = sum(second, "いいね数");
    const totalLikes1 = sum(first, "いいね数");
    const totalComments2 = sum(second, "コメント数");
    const totalComments1 = sum(first, "コメント数");
    const totalShares2 = sum(second, "シェア数");
    const totalShares1 = sum(first, "シェア数");
    const avgEng2 = avg(second, "エンゲージメント率(%)");
    const avgEng1 = avg(first, "エンゲージメント率(%)");

    const change = (a: number, b: number) => b === 0 ? Infinity : ((a - b) / b) * 100;

    return {
      views: totalViews2,
      viewsChange: change(totalViews2, totalViews1),
      likes: totalLikes2,
      likesChange: change(totalLikes2, totalLikes1),
      comments: totalComments2,
      commentsChange: change(totalComments2, totalComments1),
      shares: totalShares2,
      sharesChange: change(totalShares2, totalShares1),
      engRate: avgEng2,
      engRateChange: change(avgEng2, avgEng1),
    };
  }, [rows, dateFrom, dateTo]);

  // 日別グラフデータ
  const chartData = useMemo(() => {
    const metric = METRICS[metricIdx].key as keyof Row;
    const from = new Date(dateFrom);
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);

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
      .map(([date, vals]) => ({
        date,
        value: vals.reduce((s, v) => s + v, 0) / vals.length,
      }));
  }, [rows, dateFrom, dateTo, metricIdx]);

  // 投稿一覧（最新値・再生数順）
  const videoList = useMemo(() => {
    return [...latestByVideo].sort((a, b) => b.再生数 - a.再生数);
  }, [latestByVideo]);

  const isEngRate = METRICS[metricIdx].key === "エンゲージメント率(%)";

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 bg-black border-b border-gray-800">
        <div className="flex items-center gap-3">
          <a href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
              <span className="text-black font-bold text-xl">P</span>
            </div>
            <span className="text-white font-bold text-xl tracking-wide">Poston</span>
          </a>
        </div>
        <nav className="flex gap-6 text-sm">
          <a href="/dashboard" className="text-gray-400 hover:text-white transition">ダッシュボード</a>
          <a href="/analytics" className="text-white font-bold border-b border-white pb-0.5">アナリティクス</a>
        </nav>
      </header>

      <div className="flex-1 px-6 md:px-10 py-8 max-w-6xl mx-auto w-full">
        {/* 上部バー */}
        <div className="flex flex-wrap gap-4 mb-8">
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-2 text-sm"
          >
            {ACCOUNTS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2"
            />
            <span className="text-gray-400">〜</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2"
            />
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 mb-6 text-red-400">
            エラー: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* サマリーカード */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "合計再生数", value: summary.views.toLocaleString("ja-JP"), change: summary.viewsChange },
                { label: "合計いいね", value: summary.likes.toLocaleString("ja-JP"), change: summary.likesChange },
                { label: "合計コメント", value: summary.comments.toLocaleString("ja-JP"), change: summary.commentsChange },
                { label: "合計シェア", value: summary.shares.toLocaleString("ja-JP"), change: summary.sharesChange },
                { label: "平均エンゲージ率", value: summary.engRate.toFixed(2) + "%", change: summary.engRateChange },
              ].map((card) => (
                <div key={card.label} className="bg-gray-900 rounded-xl p-5">
                  <p className="text-gray-400 text-xs mb-2">{card.label}</p>
                  <p className="text-2xl font-bold mb-1">{card.value}</p>
                  <p className={`text-xs ${pctColor(card.change)}`}>
                    前半比 {pct(card.change)}
                  </p>
                </div>
              ))}
            </div>

            {/* グラフ */}
            <div className="bg-gray-900 rounded-xl p-6 mb-8">
              <div className="flex gap-2 mb-6 flex-wrap">
                {METRICS.map((m, i) => (
                  <button
                    key={m.key}
                    onClick={() => setMetricIdx(i)}
                    className={`px-4 py-1.5 rounded-full text-sm transition ${
                      metricIdx === i
                        ? "bg-white text-black font-bold"
                        : "bg-gray-800 text-gray-400 hover:text-white"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} />
                  <YAxis
                    tick={{ fill: "#888", fontSize: 11 }}
                    tickFormatter={(v) => isEngRate ? `${v.toFixed(1)}%` : v.toLocaleString("ja-JP")}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #444" }}
                    labelStyle={{ color: "#fff" }}
                    formatter={(v) => [
                      isEngRate ? `${Number(v).toFixed(2)}%` : Number(v).toLocaleString("ja-JP"),
                      METRICS[metricIdx].label,
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#ffffff"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#fff" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 投稿一覧 */}
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-800">
                <h2 className="font-bold text-lg">投稿一覧（再生数順）</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="text-left px-6 py-3">タイトル</th>
                      <th className="text-right px-4 py-3">再生数</th>
                      <th className="text-right px-4 py-3">いいね</th>
                      <th className="text-right px-4 py-3">コメント</th>
                      <th className="text-right px-4 py-3">シェア</th>
                      <th className="text-right px-4 py-3">エンゲージ率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {videoList.map((v) => (
                      <tr key={v.動画ID} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                        <td className="px-6 py-3 max-w-xs">
                          <div className="flex items-center gap-2">
                            {v.再生数 >= 200000 && (
                              <span className="bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full shrink-0">
                                バズ
                              </span>
                            )}
                            <span className="truncate">{v.タイトル || "（タイトルなし）"}</span>
                          </div>
                        </td>
                        <td className="text-right px-4 py-3">{v.再生数.toLocaleString("ja-JP")}</td>
                        <td className="text-right px-4 py-3">{v.いいね数.toLocaleString("ja-JP")}</td>
                        <td className="text-right px-4 py-3">{v.コメント数.toLocaleString("ja-JP")}</td>
                        <td className="text-right px-4 py-3">{v.シェア数.toLocaleString("ja-JP")}</td>
                        <td className="text-right px-4 py-3">{Number(v["エンゲージメント率(%)"]).toFixed(2)}%</td>
                      </tr>
                    ))}
                    {videoList.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center py-10 text-gray-500">データがありません</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="bg-black border-t border-gray-800 text-gray-500 text-sm text-center py-6">
        <p>© 2026 Poston. Contact: otuka.y@al-bo.io</p>
      </footer>
    </main>
  );
}
