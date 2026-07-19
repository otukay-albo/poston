"use client";

import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import LaClock from "../components/LaClock";
import { listAccounts, type StoredToken } from "../lib/tiktokToken";
import { laTodayYMD, laDefaultDateTime } from "../lib/latime";
import {
  listSchedule,
  addSchedule,
  updateSchedule,
  removeSchedule,
  type ScheduledPost,
  type ScheduleStatus,
} from "../lib/schedule";

const PALETTE = ["#E0567F", "#1F9E90", "#4C6EF5", "#C08421", "#9B5DE5", "#2E9E6B"];
const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const STATUSES: ScheduleStatus[] = ["予約", "下書き", "投稿済み"];

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const extractTags = (t: string) => t.match(/#[^\s#]+/g) || [];
const stripTags = (t: string) => t.replace(/#[^\s#]+/g, "").trim();
const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  const wd = WEEKDAYS[new Date(y, m - 1, day).getDay()];
  return `${m}/${day}(${wd})`;
};

type FormState = (Partial<ScheduledPost> & { editingId?: string }) | null;

export default function CalendarPage() {
  const la = laTodayYMD();
  const [view, setView] = useState({ year: la.year, month: la.month });
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const [items, setItems] = useState<ScheduledPost[]>([]);
  const [accounts, setAccounts] = useState<StoredToken[]>([]);
  const [form, setForm] = useState<FormState>(null);

  const reload = () => setItems(listSchedule());

  useEffect(() => {
    reload();
    setAccounts(listAccounts());
  }, []);

  const colorFor = (open_id: string) => {
    const i = accounts.findIndex((a) => a.open_id === open_id);
    return PALETTE[(i < 0 ? 0 : i) % PALETTE.length];
  };
  const nameFor = (open_id: string) =>
    accounts.find((a) => a.open_id === open_id)?.display_name || open_id.slice(0, 8);

  const cells = useMemo(() => {
    const lead = new Date(view.year, view.month, 1).getDay();
    const days = new Date(view.year, view.month + 1, 0).getDate();
    const arr: (number | null)[] = [];
    for (let i = 0; i < lead; i++) arr.push(null);
    for (let d = 1; d <= days; d++) arr.push(d);
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [view]);

  const byDate = useMemo(() => {
    const map = new Map<string, ScheduledPost[]>();
    items.forEach((it) => {
      if (!map.has(it.date)) map.set(it.date, []);
      map.get(it.date)!.push(it);
    });
    for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [items]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [items]
  );

  const prevMonth = () =>
    setView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }));
  const nextMonth = () =>
    setView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }));

  const openNew = (date?: string) => {
    const def = laDefaultDateTime();
    setForm({
      open_id: accounts[0]?.open_id || "",
      date: date || def.date,
      time: def.time,
      title: "",
      status: "予約",
    });
  };
  const openEdit = (it: ScheduledPost) => setForm({ ...it, editingId: it.id });

  const saveForm = () => {
    if (!form || !form.open_id || !form.date) return;
    const payload = {
      open_id: form.open_id,
      account_name: nameFor(form.open_id),
      date: form.date,
      time: form.time || "00:00",
      title: form.title || "",
      status: (form.status as ScheduleStatus) || "予約",
    };
    if (form.editingId) updateSchedule(form.editingId, payload);
    else addSchedule(payload);
    setForm(null);
    reload();
  };

  const deleteForm = () => {
    if (form?.editingId) {
      removeSchedule(form.editingId);
      setForm(null);
      reload();
    }
  };

  const isToday = (d: number) => view.year === la.year && view.month === la.month && d === la.day;

  // ステータス別の見た目（予約=通常 / 下書き=破線 / 投稿済み=淡色＋✓）
  const chipDeco = (status: ScheduleStatus) => ({
    opacity: status === "投稿済み" ? 0.5 : 1,
    dashed: status === "下書き",
    mark: status === "投稿済み" ? "✓ " : "",
  });

  const arrowCls =
    "w-8 h-8 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition";
  const fieldCls =
    "w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400";

  return (
    <AppShell current="calendar" title="予約カレンダー">
      <div className="flex-1 px-6 md:px-10 py-8 max-w-6xl mx-auto w-full">
        <div className="flex items-start gap-2 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-300 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 rounded-xl px-4 py-3 text-sm mb-6">
          <span>⏳</span>
          <span>自動投稿はTikTok審査中です。承認後、このカレンダーの予約が自動で投稿されます（現在は予約の作成・可視化までご利用いただけます）。予約時刻は<strong>ロサンゼルス時間（LA）</strong>基準です。</span>
        </div>

        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            {mode === "calendar" && (
              <>
                <button onClick={prevMonth} aria-label="前の月" className={arrowCls}>‹</button>
                <div className="text-lg font-bold tabular-nums">{view.year}年 {view.month + 1}月</div>
                <button onClick={nextMonth} aria-label="次の月" className={arrowCls}>›</button>
              </>
            )}
            {mode === "list" && <div className="text-lg font-bold">予約リスト</div>}
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <LaClock />
            <div className="inline-flex bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full p-0.5">
              {(["calendar", "list"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`px-4 py-1.5 rounded-full text-sm transition ${
                    mode === m ? "bg-black dark:bg-white text-white dark:text-black font-bold" : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  {m === "calendar" ? "カレンダー" : "リスト"}
                </button>
              ))}
            </div>
            <button
              onClick={() => openNew()}
              disabled={accounts.length === 0}
              className="bg-black dark:bg-white text-white dark:text-black rounded-full px-5 py-2 text-sm font-bold hover:opacity-80 transition disabled:opacity-30"
            >
              ＋ 予約を追加
            </button>
          </div>
        </div>

        {accounts.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            予約を作成するには、まずサイドバーからアカウントを追加してください。
          </p>
        )}

        {accounts.length > 0 && (
          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3 items-center">
            {accounts.map((a) => (
              <span key={a.open_id} className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorFor(a.open_id) }}></span>
                {a.display_name || a.open_id.slice(0, 8)}
              </span>
            ))}
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <span>予約=通常</span>
            <span className="opacity-70">下書き=破線</span>
            <span className="opacity-50">投稿済み=✓・淡色</span>
          </div>
        )}

        {/* ===== カレンダー表示 ===== */}
        {mode === "calendar" && (
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((w, i) => (
                <div
                  key={w}
                  className={`px-2 py-2 text-xs font-semibold border-b border-gray-200 dark:border-gray-800 ${
                    i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {w}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {cells.map((d, idx) => (
                <div
                  key={idx}
                  onClick={() => d !== null && accounts.length > 0 && openNew(ymd(view.year, view.month, d))}
                  className={`min-h-[108px] border-r border-b border-gray-100 dark:border-gray-800/60 [&:nth-child(7n)]:border-r-0 p-1.5 flex flex-col gap-1 ${
                    d === null ? "bg-gray-50 dark:bg-gray-900/40" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/40 transition"
                  }`}
                >
                  {d !== null && (
                    <>
                      <div
                        className={`text-xs mb-0.5 ${
                          isToday(d)
                            ? "self-start bg-black dark:bg-white text-white dark:text-black rounded px-1.5 font-bold"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {d}
                      </div>
                      {(byDate.get(ymd(view.year, view.month, d)) || []).map((it) => {
                        const deco = chipDeco(it.status);
                        return (
                          <button
                            key={it.id}
                            onClick={(e) => { e.stopPropagation(); openEdit(it); }}
                            className={`text-left rounded-md px-1.5 py-1 text-[11px] text-white leading-tight hover:opacity-90 ${deco.dashed ? "border border-dashed border-white/70" : ""}`}
                            style={{ background: colorFor(it.open_id), opacity: deco.opacity }}
                          >
                            <span className="font-bold tabular-nums">{deco.mark}{it.time}</span>
                            <span className="block truncate opacity-95">{it.title || "（無題）"}</span>
                          </button>
                        );
                      })}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== リスト表示 ===== */}
        {mode === "list" && (
          <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-left">
                    <th className="px-4 py-3">アカウント</th>
                    <th className="px-4 py-3 whitespace-nowrap">予約日時（LA）</th>
                    <th className="px-4 py-3">状態</th>
                    <th className="px-4 py-3">キャプション</th>
                    <th className="px-4 py-3">ハッシュタグ</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((it) => {
                    const done = it.status === "投稿済み";
                    return (
                      <tr
                        key={it.id}
                        className={`border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition ${done ? "opacity-60" : ""}`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorFor(it.open_id) }}></span>
                            {it.account_name || nameFor(it.open_id)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap tabular-nums">{fmtDate(it.date)} {it.time}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            it.status === "投稿済み" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                            : it.status === "下書き" ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                            : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          }`}>
                            {it.status === "投稿済み" ? "✓ 投稿済み" : it.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 max-w-xs"><span className="line-clamp-2">{stripTags(it.title) || "（未入力）"}</span></td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {extractTags(it.title).map((t, i) => (
                              <span key={i} className="text-xs text-indigo-500 dark:text-indigo-400">{t}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <button onClick={() => openEdit(it)} className="text-xs text-gray-500 dark:text-gray-400 underline hover:text-black dark:hover:text-white">編集</button>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedItems.length === 0 && (
                    <tr><td colSpan={6} className="text-center py-12 text-gray-400">予約がありません。「＋予約を追加」から作成できます。</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-600 mt-3">
          日付をクリックで予約を追加、予約をクリックで編集・削除できます。時刻はLA基準で、予約データはこのブラウザに保存されます。
        </p>
      </div>

      {/* 追加・編集モーダル */}
      {form && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setForm(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-lg mb-5 text-black dark:text-white">
              {form.editingId ? "予約を編集" : "予約を追加"}
            </h2>
            <div className="space-y-4 text-black dark:text-white">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">アカウント</label>
                <select
                  value={form.open_id || ""}
                  onChange={(e) => setForm((f) => (f ? { ...f, open_id: e.target.value } : f))}
                  className={fieldCls}
                >
                  {accounts.map((a) => (
                    <option key={a.open_id} value={a.open_id}>{a.display_name || a.open_id.slice(0, 8)}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">日付（LA）</label>
                  <input
                    type="date"
                    value={form.date || ""}
                    onChange={(e) => setForm((f) => (f ? { ...f, date: e.target.value } : f))}
                    className={fieldCls}
                  />
                </div>
                <div className="w-32">
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">時刻（LA）</label>
                  <input
                    type="time"
                    value={form.time || ""}
                    onChange={(e) => setForm((f) => (f ? { ...f, time: e.target.value } : f))}
                    className={fieldCls}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">キャプション（#ハッシュタグ含む）</label>
                <textarea
                  value={form.title || ""}
                  onChange={(e) => setForm((f) => (f ? { ...f, title: e.target.value } : f))}
                  rows={3}
                  placeholder="例: 夏の新習慣 #スキンケア #美容"
                  className={`${fieldCls} resize-none`}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">ステータス</label>
                <select
                  value={form.status || "予約"}
                  onChange={(e) => setForm((f) => (f ? { ...f, status: e.target.value as ScheduleStatus } : f))}
                  className={fieldCls}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between mt-6">
              <div>
                {form.editingId && (
                  <button onClick={deleteForm} className="text-sm text-red-500 hover:text-red-600">削除</button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setForm(null)}
                  className="border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-5 py-2 text-sm hover:border-black dark:hover:border-white transition"
                >
                  キャンセル
                </button>
                <button
                  onClick={saveForm}
                  disabled={!form.open_id || !form.date}
                  className="bg-black dark:bg-white text-white dark:text-black rounded-full px-6 py-2 text-sm font-bold hover:opacity-80 transition disabled:opacity-30"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
