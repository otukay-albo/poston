"use client";

import { useEffect, useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const ACCOUNTS = ["全アカウント", "yuki_beauty", "otayui", "account1", "account2", "account3"];

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
  const [account, setAccount] = useState(ACCOUNTS[0]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<"hashtag" | "hour">("hashtag");

  useEffect(() => {
    setLoading(true);
    setError("");
    const url = account === "全アカウント"
      ? "/api/analysis"
      : `/api/analysis?account=${account}`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => setRows(d.rows || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [account]);

  // 動画IDごとに最新の行だけ使う
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

  // ハッシュタグ分析
  const hashtagData = useMemo(() => {
    const map = new Map<string, { views: number; count: number; engagement: number }>();
    latest.forEach((r) => {
      const tags = (r.title || "").match(/#[\w぀-鿿]+/g) || [];
      tags.forEach((tag) => {
        const existing = map.get(tag) || { views: 0, count: 0, engagement: 0 };
        map.set(tag, {
          views: existing.views + r.view_count,
          count: existing.count + 1,
          engagement: existing.engagement + r.engagement_rate,
        });
      });
    });
    return Array.from(map.entries())
      .map(([tag, v]) => ({
        tag,
        avgViews: Math.round(v.views / v.count),
        count: v.count,
        avgEngagement: Math.round((v.engagement / v.count) * 100) / 100,
      }))
      .sort((a, b) => b.avgViews - a.avgViews)
      .slice(0, 15);
  }, [latest]);

  // 投稿時間帯分析
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
      .map(([hour, v]) => ({
        hour: `${hour}時`,
        avgViews: v.count > 0 ? Math.round(v.views / v.count) : 0,
        count: v.count,
      }));
  }, [latest]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-8 py-5 bg-black border-b border-gray-800">
        <a href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <span className="text-black font-bold text-xl">P</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">Poston</span>
        </a>
        <nav className="flex gap-6 text-sm">
          <a href="/dashboard" className="text-gray-400 hover:text-white transition">ダッシュボード</a>
          <a href="/analytics" className="text-gray-400 hover:text-white transition">アナリティクス</a>
          <a href="/analysis" className="text-white font-bold border-b border-white pb-0.5">傾向分析</a>
          <a href="/post" className="text-gray-400 hover:text-white transition">投稿</a>
        </nav>
      </header>

      <div className="flex-1 px-6 md:px-10 py-8 max-w-6xl mx-auto w-full">
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
          <div className="flex gap-2">
            <button
              onClick={() => setTab("hashtag")}
              className={`px-4 py-2 rounded-lg text-sm transition ${tab === "hashtag" ? "bg-white text-black font-bold" : "bg-gray-900 text-gray-400 hover:text-white border border-gray-700"}`}
            >
              ハッシュタグ分析
            </button>
            <button
              onClick={() => setTab("hour")}
              className={`px-4 py-2 rounded-lg text-sm transition ${tab === "hour" ? "bg-white text-black font-bold" : "bg-gray-900 text-gray-400 hover:text-white border border-gray-700"}`}
            >
              投稿時間帯分析
            </button>
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

        {!loading && !error && tab === "hashtag" && (
          <div className="bg-gray-900 rounded-xl p-6">
            <h2 className="font-bold text-lg mb-2">ハッシュタグ別 平均再生数 TOP15</h2>
            <p className="text-gray-400 text-sm mb-6">使用されているハッシュタグごとの平均再生数</p>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={hashtagData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v) => v.toLocaleString("ja-JP")} />
                <YAxis type="category" dataKey="tag" tick={{ fill: "#ccc", fontSize: 11 }} width={160} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #444" }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(v) => [Number(v).toLocaleString("ja-JP"), "平均再生数"]}
                />
                <Bar dataKey="avgViews" fill="#ffffff" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="text-left py-3 px-4">ハッシュタグ</th>
                    <th className="text-right py-3 px-4">使用回数</th>
                    <th className="text-right py-3 px-4">平均再生数</th>
                    <th className="text-right py-3 px-4">平均エンゲージ率</th>
                  </tr>
                </thead>
                <tbody>
                  {hashtagData.map((h) => (
                    <tr key={h.tag} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="py-3 px-4 text-white">{h.tag}</td>
                      <td className="text-right py-3 px-4">{h.count}</td>
                      <td className="text-right py-3 px-4">{h.avgViews.toLocaleString("ja-JP")}</td>
                      <td className="text-right py-3 px-4">{h.avgEngagement}%</td>
                    </tr>
                  ))}
                  {hashtagData.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-10 text-gray-500">データがありません</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && tab === "hour" && (
          <div className="bg-gray-900 rounded-xl p-6">
            <h2 className="font-bold text-lg mb-2">投稿時間帯別 平均再生数</h2>
            <p className="text-gray-400 text-sm mb-6">どの時間帯に投稿すると再生数が伸びやすいか</p>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={hourData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="hour" tick={{ fill: "#888", fontSize: 10 }} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} tickFormatter={(v) => v.toLocaleString("ja-JP")} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #444" }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(v) => [Number(v).toLocaleString("ja-JP"), "平均再生数"]}
                />
                <Bar dataKey="avgViews" fill="#ffffff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="text-left py-3 px-4">時間帯</th>
                    <th className="text-right py-3 px-4">投稿数</th>
                    <th className="text-right py-3 px-4">平均再生数</th>
                  </tr>
                </thead>
                <tbody>
                  {hourData.filter((h) => h.count > 0).sort((a, b) => b.avgViews - a.avgViews).map((h) => (
                    <tr key={h.hour} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                      <td className="py-3 px-4 text-white">{h.hour}</td>
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

      <footer className="bg-black border-t border-gray-800 text-gray-500 text-sm text-center py-6">
        <p>© 2026 Poston. Contact: otuka.y@al-bo.io</p>
      </footer>
    </main>
  );
}
