"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import AppShell from "../components/AppShell";
import AnalyticsAccountBar from "../components/AnalyticsAccountBar";
import TrendAnalysis from "../components/TrendAnalysis";

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
  const [analyticsNames, setAnalyticsNames] = useState<string[] | null>(null);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [期間プリセット, set期間プリセット] = useState("30日");
  const [metricIdx, setMetricIdx] = useState(0);
  const [メインタブ, setメインタブ] = useState<"overview" | "trend">("overview");

  // URLの ?tab=trend で傾向分析タブを直接開けるようにする
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("tab") === "trend") setメインタブ("trend");
  }, []);

  // 期間プリセット（押すと日付範囲を自動設定 → 数値・グラフが再計算される）
  // 「カスタム」を選んだときだけ日付カレンダーを表示する
  const applyPreset = (label: string) => {
    set期間プリセット(label);
    if (label === "カスタム") return; // 現在の日付範囲を保持したまま手動選択へ
    const toStr = new Date().toISOString().split("T")[0];
    if (label === "全期間") {
      setDateFrom("2020-01-01");
      setDateTo(toStr);
      return;
    }
    const days = ({ "1日": 1, "3日": 3, "7日": 7, "30日": 30 } as Record<string, number>)[label] ?? 30;
    const from = new Date();
    from.setDate(from.getDate() - (days - 1));
    setDateFrom(from.toISOString().split("T")[0]);
    setDateTo(toStr);
  };
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!analyticsNames || analyticsNames.length === 0) { setRows([]); return; }
    setLoading(true);
    setError("");
    setRows([]);
    // 複数アカウント（全アカウント合計）にも対応：並列取得してマージ
    Promise.all(
      analyticsNames.map((n) =>
        fetch(`/api/analytics?account=${encodeURIComponent(n)}`)
          .then((r) => r.json())
          .then((data) => (data.error ? [] : data.rows || []))
          .catch(() => [])
      )
    )
      .then((results) => setRows(results.flat()))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [analyticsNames]);

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

  // CSV書き出し（Excel/スプレッドシートで開ける形式）
  const escapeCSV = (val: string | number) => {
    const s = String(val ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const downloadCSV = () => {
    const headers = ["タイトル", "再生数", "いいね", "いいね率(%)", "コメント", "共有", "共有率(%)", "エンゲージ率(%)", "投稿日時"];
    const lines = videoList.map((v) => {
      const likeRate = v.再生数 > 0 ? ((v.いいね数 / v.再生数) * 100).toFixed(2) : "0.00";
      const shareRate = v.再生数 > 0 ? ((v.シェア数 / v.再生数) * 100).toFixed(2) : "0.00";
      return [
        v.タイトル || "（タイトルなし）",
        v.再生数,
        v.いいね数,
        likeRate,
        v.コメント数,
        v.シェア数,
        shareRate,
        Number(v["エンゲージメント率(%)"]).toFixed(2),
        v.投稿日時 || "",
      ]
        .map(escapeCSV)
        .join(",");
    });
    // 先頭のBOM(﻿)でExcelがUTF-8として正しく開ける
    const csv = "﻿" + [headers.join(","), ...lines].join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `poston_${analyticsNames && analyticsNames.length === 1 ? analyticsNames[0] : "all"}_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppShell current="analytics" title="アナリティクス">
      <div className="flex-1 px-6 md:px-10 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <AnalyticsAccountBar onResolve={setAnalyticsNames} />
          <span className="hidden sm:block w-px h-5 bg-gray-200 dark:bg-gray-800"></span>
          <div className="inline-flex bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full p-0.5">
            {([["overview", "概要"], ["trend", "傾向分析"]] as const).map(([v, l]) => (
              <button
                key={v}
                onClick={() => setメインタブ(v)}
                className={`px-4 py-1.5 rounded-full text-sm transition ${
                  メインタブ === v
                    ? "bg-black dark:bg-white text-white dark:text-black font-bold"
                    : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {メインタブ === "overview" && (
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <div className="flex gap-1.5 flex-wrap">
              {["1日", "3日", "7日", "30日", "全期間", "カスタム"].map((p) => (
                <button
                  key={p}
                  onClick={() => applyPreset(p)}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition ${
                    期間プリセット === p
                      ? "bg-black dark:bg-white text-white dark:text-black font-bold"
                      : "bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {期間プリセット === "カスタム" && (
              <div className="flex items-center gap-2 text-sm">
                <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5" />
                <span className="text-gray-400">〜</span>
                <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5" />
              </div>
            )}
          </div>
        )}

        {メインタブ === "trend" && <TrendAnalysis analyticsNames={analyticsNames} />}

        {メインタブ === "overview" && loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {メインタブ === "overview" && error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 mb-6 text-red-600 dark:text-red-400">
            エラー: {error}
          </div>
        )}

        {メインタブ === "overview" && !loading && !error && analyticsNames && analyticsNames.length > 0 && (
          <>
            {/* 左：数値サマリー ／ 右：グラフ のコンパクト2カラム */}
            <div className="grid grid-cols-1 lg:grid-cols-[250px_1fr] gap-4 mb-8 items-stretch">
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl px-4 py-3 flex flex-col justify-center divide-y divide-gray-200/70 dark:divide-gray-800/70">
                {[
                  { label: "再生数", value: summary.totalViews.toLocaleString("ja-JP"), sub: null },
                  { label: "いいね", value: summary.totalLikes.toLocaleString("ja-JP"), sub: `いいね率 ${summary.likeRate.toFixed(2)}%` },
                  { label: "コメント", value: summary.totalComments.toLocaleString("ja-JP"), sub: null },
                  { label: "共有", value: summary.totalShares.toLocaleString("ja-JP"), sub: `共有率 ${summary.shareRate.toFixed(2)}%` },
                  { label: "平均エンゲージ率", value: `${summary.avgEng.toFixed(2)}%`, sub: null },
                ].map((card) => (
                  <div key={card.label} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                      {card.sub && <p className="text-[10px] text-gray-400 dark:text-gray-600">{card.sub}</p>}
                    </div>
                    <p className="text-lg font-bold tabular-nums shrink-0">{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 min-w-0">
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {METRICS.map((m, i) => (
                    <button
                      key={m.key}
                      onClick={() => setMetricIdx(i)}
                      className={`px-3 py-1 rounded-full text-xs transition ${
                        metricIdx === i
                          ? "bg-black dark:bg-white text-white dark:text-black font-bold"
                          : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
                <ResponsiveContainer width="100%" height={230}>
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
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between gap-4">
                <h2 className="font-bold text-lg">投稿一覧（再生数順）</h2>
                <button
                  onClick={downloadCSV}
                  disabled={videoList.length === 0}
                  className="text-sm border border-gray-300 dark:border-gray-700 rounded-full px-4 py-1.5 whitespace-nowrap hover:border-black dark:hover:border-white transition disabled:opacity-30"
                >
                  ⬇ CSVダウンロード
                </button>
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
    </AppShell>
  );
}
