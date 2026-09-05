"use client";

import { useEffect, useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import AppShell from "../components/AppShell";
import AnalyticsAccountBar from "../components/AnalyticsAccountBar";
import TrendAnalysis from "../components/TrendAnalysis";
import { getTeamKey } from "../lib/tiktokToken";

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

// 端末のローカル日付で YYYY-MM-DD を作る。
// toISOString()はUTCになるため、日本時間の朝9時前は「昨日」になってしまう。
const ymd = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const daysAgoYMD = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return ymd(d);
};

export default function AnalyticsPage() {
  const [analyticsNames, setAnalyticsNames] = useState<string[] | null>(null);
  const [dateFrom, setDateFrom] = useState(() => daysAgoYMD(29));
  const [dateTo, setDateTo] = useState(() => ymd(new Date()));
  const [期間プリセット, set期間プリセット] = useState("30日");
  const 今日 = ymd(new Date()); // 日付入力の上限（未来日を選べないように）
  const [metricIdx, setMetricIdx] = useState(0);
  const [メインタブ, setメインタブ] = useState<"overview" | "aggregate" | "trend">("overview");
  const [集計粒度, set集計粒度] = useState<"月別" | "週別" | "日別">("週別");
  const [収集中, set収集中] = useState(false);
  const [収集Msg, set収集Msg] = useState("");

  // チーム同期のアカウントを対象に、Postonが今すぐデータ収集を実行する
  const 収集実行 = async () => {
    const key = getTeamKey();
    if (!key) {
      set収集Msg("サイドバー左下の「チーム同期を設定」を先に行ってください");
      return;
    }
    set収集中(true);
    set収集Msg("");
    try {
      const res = await fetch("/api/collect-stats", { method: "POST", headers: { "x-team-key": key } });
      const data = await res.json();
      if (!res.ok) {
        set収集Msg(`エラー: ${data.error || res.status}`);
      } else {
        const summary = (data.results || [])
          .map((r: { account: string; inserted?: number; error?: string }) =>
            r.error ? `${r.account}: ${r.error}` : `${r.account}: ${r.inserted}件`)
          .join(" ／ ");
        set収集Msg(`✅ 収集完了（${summary}）。反映のため再読み込みします...`);
        setTimeout(() => window.location.reload(), 1800);
      }
    } catch (e) {
      set収集Msg("エラー: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      set収集中(false);
    }
  };

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
    const toStr = ymd(new Date());
    if (label === "全期間") {
      setDateFrom("2020-01-01");
      setDateTo(toStr);
      return;
    }
    const days = ({ "1日": 1, "3日": 3, "7日": 7, "30日": 30 } as Record<string, number>)[label] ?? 30;
    setDateFrom(daysAgoYMD(days - 1));
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

  // 同じ動画が何度も収集されるため、動画ごとに最新のスナップショットだけを残す
  const latestAll = useMemo(() => {
    const map = new Map<string, Row>();
    rows.forEach((r) => {
      const existing = map.get(r.動画ID);
      if (!existing || new Date(r.取得日時) > new Date(existing.取得日時)) {
        map.set(r.動画ID, r);
      }
    });
    return Array.from(map.values());
  }, [rows]);

  // 期間は「動画を投稿した日」で絞り込む（データを収集した日ではない）。
  // 収集日で絞ると、どの期間を選んでも最新スナップショットが同じになり
  // 数値が変わらないため。
  // 日付が未入力・不正でも「全部0」にならないよう安全側に倒す
  const 期間範囲 = useMemo(() => {
    const parse = (s: string, suffix: string) => {
      const d = new Date(s.replace(/\//g, "-") + suffix);
      return isNaN(d.getTime()) ? null : d;
    };
    let from = parse(dateFrom, "T00:00:00") ?? new Date("2020-01-01T00:00:00");
    let to = parse(dateTo, "T23:59:59") ?? new Date();
    if (from > to) [from, to] = [to, from]; // 逆順に入力されても動くように
    return { from, to };
  }, [dateFrom, dateTo]);

  const latestByVideo = useMemo(() => {
    const { from, to } = 期間範囲;
    return latestAll.filter((r) => {
      if (!r.投稿日時) return 期間プリセット === "全期間"; // 投稿日不明は全期間のみ対象
      const d = new Date(r.投稿日時);
      return d >= from && d <= to;
    });
  }, [latestAll, 期間範囲, 期間プリセット]);

  // データが存在する投稿日の範囲（期間外を選んだときの案内に使う）
  const データ範囲 = useMemo(() => {
    const ds = latestAll
      .map((r) => r.投稿日時)
      .filter(Boolean)
      .map((s) => new Date(s as string))
      .sort((a, b) => a.getTime() - b.getTime());
    if (ds.length === 0) return null;
    const f = (d: Date) => d.toLocaleDateString("ja-JP", { year: "numeric", month: "numeric", day: "numeric" });
    return { from: f(ds[0]), to: f(ds[ds.length - 1]) };
  }, [latestAll]);

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
    const commentRate = totalViews > 0 ? (totalComments / totalViews) * 100 : 0;
    return { totalViews, totalLikes, totalComments, totalShares, avgEng, likeRate, shareRate, commentRate };
  }, [latestByVideo]);

  // ===== 集計ビュー（月別/週別/日別）: 投稿日時ベース・全取得データ対象 =====

  const median = (nums: number[]) => {
    if (nums.length === 0) return 0;
    const s = [...nums].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 === 0 ? Math.round((s[mid - 1] + s[mid]) / 2) : s[mid];
  };

  const 集計データ = useMemo(() => {
    const groups = new Map<string, { label: string; views: number[] }>();
    latestAll.forEach((r) => {
      if (!r.投稿日時) return;
      const d = new Date(r.投稿日時);
      if (isNaN(d.getTime())) return;
      let key = "";
      let label = "";
      if (集計粒度 === "月別") {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        label = `${d.getFullYear()}/${d.getMonth() + 1}`;
      } else if (集計粒度 === "週別") {
        const start = new Date(d);
        start.setDate(d.getDate() - ((d.getDay() + 6) % 7)); // 週の開始=月曜
        key = start.toISOString().slice(0, 10);
        label = `${start.getMonth() + 1}/${start.getDate()}週`;
      } else {
        key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        label = `${d.getMonth() + 1}/${d.getDate()}`;
      }
      if (!groups.has(key)) groups.set(key, { label, views: [] });
      groups.get(key)!.views.push(r.再生数 || 0);
    });
    return Array.from(groups.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, g]) => ({
        期間: g.label,
        投稿本数: g.views.length,
        中央値: median(g.views),
        合計: g.views.reduce((s, v) => s + v, 0),
      }));
  }, [latestAll, 集計粒度]);

  // グラフも「投稿日」を横軸にする（期間の絞り込みと基準を揃える）
  const chartData = useMemo(() => {
    const metric = METRICS[metricIdx].key as keyof Row;
    const dayMap = new Map<string, { t: number; vals: number[] }>();
    latestByVideo.forEach((r) => {
      if (!r.投稿日時) return;
      const d = new Date(r.投稿日時);
      const dateStr = d.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" });
      if (!dayMap.has(dateStr)) dayMap.set(dateStr, { t: d.getTime(), vals: [] });
      dayMap.get(dateStr)!.vals.push(Number(r[metric]) || 0);
    });
    return Array.from(dayMap.entries())
      .sort((a, b) => a[1].t - b[1].t)
      .map(([date, { vals }]) => ({ date, value: vals.reduce((s, v) => s + v, 0) / vals.length }));
  }, [latestByVideo, metricIdx]);

  const videoList = useMemo(() => [...latestByVideo].sort((a, b) => b.再生数 - a.再生数), [latestByVideo]);
  const isEngRate = METRICS[metricIdx].key === "エンゲージメント率(%)";

  // CSV書き出し（Excel/スプレッドシートで開ける形式）
  const escapeCSV = (val: string | number) => {
    const s = String(val ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const downloadCSV = () => {
    const headers = ["タイトル", "再生数", "いいね", "いいね率(%)", "コメント", "コメント率(%)", "共有", "共有率(%)", "エンゲージ率(%)", "尺(秒)", "投稿日時"];
    const lines = videoList.map((v) => {
      const likeRate = v.再生数 > 0 ? ((v.いいね数 / v.再生数) * 100).toFixed(2) : "0.00";
      const shareRate = v.再生数 > 0 ? ((v.シェア数 / v.再生数) * 100).toFixed(2) : "0.00";
      const commentRate = v.再生数 > 0 ? ((v.コメント数 / v.再生数) * 100).toFixed(2) : "0.00";
      return [
        v.タイトル || "（タイトルなし）",
        v.再生数,
        v.いいね数,
        likeRate,
        v.コメント数,
        commentRate,
        v.シェア数,
        shareRate,
        Number(v["エンゲージメント率(%)"]).toFixed(2),
        v["動画時間(秒)"] ?? "",
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
            {([["overview", "概要"], ["aggregate", "集計"], ["trend", "傾向分析"]] as const).map(([v, l]) => (
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
          <button
            onClick={収集実行}
            disabled={収集中}
            title="チーム同期に登録された全アカウントの最新データをTikTokから取得します"
            className="ml-auto text-xs border border-gray-300 dark:border-gray-700 rounded-full px-3.5 py-1.5 hover:border-black dark:hover:border-white transition disabled:opacity-40 whitespace-nowrap"
          >
            {収集中 ? "更新中..." : "🔄 更新"}
          </button>
        </div>

        {収集Msg && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 -mt-1">{収集Msg}</p>
        )}

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
                {/* 未来日は選べないように max を今日に固定し、開始>終了も防ぐ */}
                <input type="date" value={dateFrom} max={dateTo || 今日}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5" />
                <span className="text-gray-400">〜</span>
                <input type="date" value={dateTo} min={dateFrom} max={今日}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5" />
              </div>
            )}
            {/* 実際に適用されている範囲を明示（反映されているか一目で分かるように） */}
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              投稿日 {期間範囲.from.toLocaleDateString("ja-JP")} 〜 {期間範囲.to.toLocaleDateString("ja-JP")} で絞り込み
              （{latestByVideo.length}本）
            </span>
          </div>
        )}

        {/* 期間内に投稿がない場合は、黙って0を並べず理由を示す */}
        {メインタブ === "overview" && !loading && latestByVideo.length === 0 && latestAll.length > 0 && (
          <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-300 dark:border-yellow-800 rounded-xl px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300">
            この期間に投稿された動画はありません。
            {データ範囲 && <>（データがあるのは {データ範囲.from} 〜 {データ範囲.to} の投稿）</>}
            <button onClick={() => applyPreset("全期間")} className="underline font-bold ml-2">
              全期間で見る
            </button>
          </div>
        )}

        {メインタブ === "trend" && <TrendAnalysis analyticsNames={analyticsNames} />}

        {メインタブ === "aggregate" && (
          <>
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              <div className="flex gap-1.5">
                {(["月別", "週別", "日別"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => set集計粒度(g)}
                    className={`px-3.5 py-1.5 rounded-full text-xs transition ${
                      集計粒度 === g
                        ? "bg-black dark:bg-white text-white dark:text-black font-bold"
                        : "bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:text-black dark:hover:text-white"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-600">投稿日ベース・全取得データ対象（各動画は最新値）</span>
            </div>

            {集計データ.length === 0 ? (
              <p className="text-gray-400 py-10 text-center">データがありません</p>
            ) : (
              <>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 mb-4">
                  <p className="text-sm font-bold mb-2">インプレッション中央値の推移（{集計粒度}）</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={集計データ}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ccc" className="dark:[stroke:#333]" />
                      <XAxis dataKey="期間" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => v.toLocaleString("ja-JP")} />
                      <Tooltip formatter={(v) => [Number(v).toLocaleString("ja-JP"), "中央値"]} />
                      <Bar dataKey="中央値" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400">
                          <th className="text-left px-6 py-3">期間</th>
                          <th className="text-right px-4 py-3">投稿本数</th>
                          <th className="text-right px-4 py-3">インプレッション中央値</th>
                          <th className="text-right px-4 py-3">合計インプレッション</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...集計データ].reverse().map((g) => (
                          <tr key={g.期間} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800/30 transition">
                            <td className="px-6 py-3 tabular-nums">{g.期間}</td>
                            <td className="text-right px-4 py-3 tabular-nums">{g.投稿本数}</td>
                            <td className="text-right px-4 py-3 tabular-nums">{g.中央値.toLocaleString("ja-JP")}</td>
                            <td className="text-right px-4 py-3 tabular-nums">{g.合計.toLocaleString("ja-JP")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </>
        )}

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
                  { label: "コメント", value: summary.totalComments.toLocaleString("ja-JP"), sub: `コメント率 ${summary.commentRate.toFixed(2)}%` },
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
                      <th className="text-right px-4 py-3">コメント率</th>
                      <th className="text-right px-4 py-3">共有</th>
                      <th className="text-right px-4 py-3">共有率</th>
                      <th className="text-right px-4 py-3">エンゲージ率</th>
                      <th className="text-right px-4 py-3">尺(秒)</th>
                      <th className="text-right px-4 py-3 whitespace-nowrap">投稿日時</th>
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
                        <td className="text-right px-4 py-3 text-gray-500 dark:text-gray-400">{v.再生数 > 0 ? ((v.コメント数 / v.再生数) * 100).toFixed(2) : "0.00"}%</td>
                        <td className="text-right px-4 py-3">{v.シェア数.toLocaleString("ja-JP")}</td>
                        <td className="text-right px-4 py-3 text-gray-500 dark:text-gray-400">{v.再生数 > 0 ? ((v.シェア数 / v.再生数) * 100).toFixed(2) : "0.00"}%</td>
                        <td className="text-right px-4 py-3">{Number(v["エンゲージメント率(%)"]).toFixed(2)}%</td>
                        <td className="text-right px-4 py-3 text-gray-500 dark:text-gray-400">{v["動画時間(秒)"] || "-"}</td>
                        <td className="text-right px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {v.投稿日時 ? new Date(v.投稿日時).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}
                        </td>
                      </tr>
                    ))}
                    {videoList.length === 0 && (
                      <tr><td colSpan={11} className="text-center py-10 text-gray-400">データがありません</td></tr>
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
