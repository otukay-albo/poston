"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import AppShell from "../components/AppShell";
import AnalyticsAccountBar from "../components/AnalyticsAccountBar";

interface Row {
  account_name: string;
  title: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  engagement_rate: number;
  posted_at: string | null;
  fetched_at: string;
}

export default function AnalysisPage() {
  const [analyticsNames, setAnalyticsNames] = useState<string[] | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"hashtag" | "hour">("hashtag");

  useEffect(() => {
    if (!analyticsNames || analyticsNames.length === 0) { setRows([]); return; }
    setLoading(true);
    setError("");
    // 複数アカウント（全アカウント合計）にも対応：並列取得してマージ
    Promise.all(
      analyticsNames.map((n) =>
        fetch(`/api/analysis?account=${encodeURIComponent(n)}`)
          .then((r) => r.json())
          .then((d) => d.rows || [])
          .catch(() => [])
      )
    )
      .then((results) => setRows(results.flat()))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [analyticsNames]);

  const latest = useMemo(() => {
    const map = new Map<string, Row>();
    rows.forEach((r) => {
      const key = r.account_name + "_" + r.title;
      const existing = map.get(key);
      if (!existing || new Date(r.fetched_at) > new Date(existing.fetched_at)) {
        map.set(key, r);
      }
    });
    return Array.from(map.values());
  }, [rows]);

  const hashtagData = useMemo(() => {
    const map = new Map<string, { views: number; count: number; engagement: number }>();
    latest.forEach((r) => {
      const tags = (r.title || "").match(/#[\w぀-鿿]+/g) || [];
      tags.forEach((tag) => {
        const existing = map.get(tag) || { views: 0, count: 0, engagement: 0 };
        map.set(tag, { views: existing.views + r.view_count, count: existing.count + 1, engagement: existing.engagement + r.engagement_rate });
      });
    });
    return Array.from(map.entries())
      .map(([tag, v]) => ({ tag, avgViews: Math.round(v.views / v.count), count: v.count, avgEngagement: Math.round((v.engagement / v.count) * 100) / 100 }))
      .sort((a, b) => b.avgViews - a.avgViews)
      .slice(0, 15);
  }, [latest]);

  const hourData = useMemo(() => {
    const map = new Map<number, { views: number; count: number }>();
    for (let i = 0; i < 24; i++) map.set(i, { views: 0, count: 0 });
    latest.forEach((r) => {
      if (!r.posted_at) return;
      const hour = new Date(r.posted_at).getHours();
      const existing = map.get(hour)!;
      map.set(hour, { views: existing.views + r.view_count, count: existing.count + 1 });
    });
    return Array.from(map.entries())
      .map(([hour, v]) => ({ hour: `${hour}時`, avgViews: v.count > 0 ? Math.round(v.views / v.count) : 0, count: v.count }));
  }, [latest]);

  return (
    <AppShell current="analysis" title="傾向分析">
      <div className="flex-1 px-6 md:px-10 py-8 max-w-6xl mx-auto w-full">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <AnalyticsAccountBar onResolve={setAnalyticsNames} />
          <span className="hidden sm:block w-px h-5 bg-gray-200 dark:bg-gray-800"></span>
          <div className="flex gap-2">
            {(["hashtag", "hour"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-lg text-sm transition ${
                  tab === t
                    ? "bg-black dark:bg-white text-white dark:text-black font-bold"
                    : "bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white border border-gray-200 dark:border-gray-700"
                }`}
              >
                {t === "hashtag" ? "ハッシュタグ分析" : "投稿時間帯分析"}
              </button>
            ))}
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

        {!loading && !error && analyticsNames && analyticsNames.length > 0 && tab === "hashtag" && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
            <h2 className="font-bold text-lg mb-2">ハッシュタグ別 平均再生数 TOP15</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">使用されているハッシュタグごとの平均再生数</p>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={hashtagData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString("ja-JP")} />
                <YAxis type="category" dataKey="tag" tick={{ fontSize: 11 }} width={160} />
                <Tooltip formatter={(v) => [Number(v).toLocaleString("ja-JP"), "平均再生数"]} />
                <Bar dataKey="avgViews" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                    <th className="text-left py-3 px-4">ハッシュタグ</th>
                    <th className="text-right py-3 px-4">使用回数</th>
                    <th className="text-right py-3 px-4">平均再生数</th>
                    <th className="text-right py-3 px-4">平均エンゲージ率</th>
                  </tr>
                </thead>
                <tbody>
                  {hashtagData.map((h) => (
                    <tr key={h.tag} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/30 transition">
                      <td className="py-3 px-4">{h.tag}</td>
                      <td className="text-right py-3 px-4">{h.count}</td>
                      <td className="text-right py-3 px-4">{h.avgViews.toLocaleString("ja-JP")}</td>
                      <td className="text-right py-3 px-4">{h.avgEngagement}%</td>
                    </tr>
                  ))}
                  {hashtagData.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-10 text-gray-400">データがありません</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && analyticsNames && analyticsNames.length > 0 && tab === "hour" && (
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6">
            <h2 className="font-bold text-lg mb-2">投稿時間帯別 平均再生数</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">どの時間帯に投稿すると再生数が伸びやすいか</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString("ja-JP")} />
                <Tooltip formatter={(v) => [Number(v).toLocaleString("ja-JP"), "平均再生数"]} />
                <Bar dataKey="avgViews" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                    <th className="text-left py-3 px-4">時間帯</th>
                    <th className="text-right py-3 px-4">投稿数</th>
                    <th className="text-right py-3 px-4">平均再生数</th>
                  </tr>
                </thead>
                <tbody>
                  {hourData.filter((h) => h.count > 0).sort((a, b) => b.avgViews - a.avgViews).map((h) => (
                    <tr key={h.hour} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/30 transition">
                      <td className="py-3 px-4">{h.hour}</td>
                      <td className="text-right py-3 px-4">{h.count}</td>
                      <td className="text-right py-3 px-4">{h.avgViews.toLocaleString("ja-JP")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-200 dark:border-gray-800 text-gray-400 text-sm text-center py-6">
        © 2026 Poston
      </footer>
    </AppShell>
  );
}
