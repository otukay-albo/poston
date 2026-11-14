"use client";

import { useEffect, useMemo, useState } from "react";
import LaClock from "./LaClock";
import { listAccounts, type StoredToken } from "../lib/tiktokToken";
import { laTodayYMD, laDefaultDateTime, utcToLA } from "../lib/latime";
import {
  listSchedule,
  addSchedule,
  updateSchedule,
  removeSchedule,
  fetchAutoPosts,
  cancelAutoPost,
  type ScheduledPost,
  type ScheduleStatus,
  type AutoPost,
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

// カレンダーに並べる1件。
// auto = サーバーに登録された予約（時刻になると自動投稿される）
// memo = ブラウザ内のメモ（自動投稿されない）
type CalItem =
  | { kind: "auto"; id: string; open_id: string; date: string; time: string; title: string; post: AutoPost }
  | { kind: "memo"; id: string; open_id: string; date: string; time: string; title: string; memo: ScheduledPost };

const 公開範囲ラベル: Record<string, string> = {
  PUBLIC_TO_EVERYONE: "全員に公開",
  MUTUAL_FOLLOW_FRIENDS: "相互フォロワーのみ",
  FOLLOWER_OF_CREATOR: "フォロワーのみ",
  SELF_ONLY: "自分のみ（非公開）",
};

// 予約カレンダー本体（投稿ページのタブ内で使用）
// onNewPost: 「＋予約を追加」で投稿タブへ切り替えるためのコールバック
export default function ScheduleCalendar({ onNewPost }: { onNewPost?: () => void }) {
  const la = laTodayYMD();
  const [view, setView] = useState({ year: la.year, month: la.month });
  const [mode, setMode] = useState<"calendar" | "list">("calendar");
  const [items, setItems] = useState<ScheduledPost[]>([]);
  const [accounts, setAccounts] = useState<StoredToken[]>([]);
  const [form, setForm] = useState<FormState>(null);
  const [autoPosts, setAutoPosts] = useState<AutoPost[]>([]);
  const [autoMsg, setAutoMsg] = useState("");
  const [detail, setDetail] = useState<AutoPost | null>(null);
  const [busy, setBusy] = useState(false);

  const reload = () => setItems(listSchedule());

  // サーバーに登録された予約（自動投稿されるもの）を読み込む
  const reloadAuto = async () => {
    const r = await fetchAutoPosts();
    if (r.ok) {
      setAutoPosts(r.posts);
      setAutoMsg("");
    } else if (r.noKey) {
      setAutoMsg("自動投稿の予約を表示するには、サイドバー左下の「チーム同期を設定」を行ってください。");
    } else {
      setAutoMsg(`予約を読み込めませんでした: ${r.error}`);
    }
  };

  useEffect(() => {
    reload();
    setAccounts(listAccounts());
    reloadAuto();
  }, []);

  const cancelDetail = async () => {
    if (!detail) return;
    const msg =
      detail.status === "予約"
        ? "この予約を取り消しますか？保存した動画も削除されます。"
        : "この記録を一覧から削除しますか？（TikTokに投稿済みの動画は消えません）";
    if (!window.confirm(msg)) return;
    setBusy(true);
    const r = await cancelAutoPost(detail.id);
    setBusy(false);
    if (!r.ok) {
      window.alert(r.error || "削除に失敗しました");
      return;
    }
    setDetail(null);
    reloadAuto();
  };

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

  // 自動投稿の予約とメモを、同じ形に揃えて1つの一覧にする
  const allItems = useMemo<CalItem[]>(() => {
    const autos: CalItem[] = autoPosts.map((p) => {
      const la = utcToLA(p.run_at);
      return { kind: "auto", id: p.id, open_id: p.open_id, date: la.date, time: la.time, title: p.title, post: p };
    });
    const memos: CalItem[] = items.map((m) => ({
      kind: "memo", id: m.id, open_id: m.open_id, date: m.date, time: m.time, title: m.title, memo: m,
    }));
    return [...autos, ...memos];
  }, [autoPosts, items]);

  const byDate = useMemo(() => {
    const map = new Map<string, CalItem[]>();
    allItems.forEach((it) => {
      if (!map.has(it.date)) map.set(it.date, []);
      map.get(it.date)!.push(it);
    });
    for (const list of map.values()) list.sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [allItems]);

  const sortedItems = useMemo(
    () => [...allItems].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [allItems]
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
    "w-7 h-7 rounded-lg border border-gray-300 dark:border-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition";
  const fieldCls =
    "w-full bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-500 dark:focus:border-gray-400";

  return (
    <div className="flex-1 px-6 md:px-10 py-4 max-w-6xl mx-auto w-full">
      {/* 操作バー（コンパクト） */}
      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          {mode === "calendar" && (
            <>
              <button onClick={prevMonth} aria-label="前の月" className={arrowCls}>‹</button>
              <div className="text-base font-bold tabular-nums">{view.year}年 {view.month + 1}月</div>
              <button onClick={nextMonth} aria-label="次の月" className={arrowCls}>›</button>
            </>
          )}
          {mode === "list" && <div className="text-base font-bold">予約リスト</div>}
          <span className="text-[11px] text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full px-2.5 py-0.5">
            時刻はLA基準
          </span>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <LaClock />
          <div className="inline-flex bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full p-0.5">
            {(["calendar", "list"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-3.5 py-1 rounded-full text-xs transition ${
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
            title="動画がまだ無い投稿計画などを書き留めます（自動投稿はされません）"
            className="border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-3.5 py-1.5 text-xs hover:border-black dark:hover:border-white transition disabled:opacity-30"
          >
            ＋ メモ
          </button>
          <button
            onClick={() => onNewPost?.()}
            disabled={accounts.length === 0}
            title="動画を選んで、自動投稿の予約を作成します"
            className="bg-black dark:bg-white text-white dark:text-black rounded-full px-4 py-1.5 text-xs font-bold hover:opacity-80 transition disabled:opacity-30"
          >
            ＋ 予約を追加
          </button>
        </div>
      </div>

      {accounts.length === 0 && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
          予約を作成するには、まずサイドバーからアカウントを追加してください。
        </p>
      )}

      {accounts.length > 0 && (
        <div className="flex flex-wrap gap-3 text-[11px] text-gray-500 dark:text-gray-400 mb-2 items-center">
          {accounts.map((a) => (
            <span key={a.open_id} className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: colorFor(a.open_id) }}></span>
              {a.display_name || a.open_id.slice(0, 8)}
            </span>
          ))}
          <span className="text-gray-300 dark:text-gray-700">|</span>
          <span>⏰ 予約（自動投稿）</span>
          <span className="opacity-50">✓ 投稿済み</span>
          <span className="text-red-500">⚠ 失敗</span>
          <span className="opacity-70">破線=メモ（自動投稿されません）</span>
        </div>
      )}

      {autoMsg && (
        <p className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 rounded-lg px-3 py-2 mb-2">
          {autoMsg}
        </p>
      )}

      {/* ===== カレンダー表示 ===== */}
      {mode === "calendar" && (
        <div className="border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((w, i) => (
              <div
                key={w}
                className={`px-2 py-1 text-[11px] font-semibold border-b border-gray-200 dark:border-gray-800 ${
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
                className={`min-h-[72px] border-r border-b border-gray-100 dark:border-gray-800/60 [&:nth-child(7n)]:border-r-0 p-1 flex flex-col gap-0.5 ${
                  d === null ? "bg-gray-50 dark:bg-gray-900/40" : "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900/40 transition"
                }`}
              >
                {d !== null && (
                  <>
                    <div
                      className={`text-[11px] ${
                        isToday(d)
                          ? "self-start bg-black dark:bg-white text-white dark:text-black rounded px-1 font-bold"
                          : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {d}
                    </div>
                    {(byDate.get(ymd(view.year, view.month, d)) || []).map((it) => {
                      if (it.kind === "auto") {
                        const st = it.post.status;
                        return (
                          <button
                            key={`a-${it.id}`}
                            onClick={(e) => { e.stopPropagation(); setDetail(it.post); }}
                            className={`text-left rounded px-1 py-0.5 text-[10px] text-white leading-tight hover:opacity-90 ${st === "失敗" ? "ring-2 ring-red-500" : ""}`}
                            style={{ background: colorFor(it.open_id), opacity: st === "投稿済み" ? 0.5 : 1 }}
                          >
                            <span className="font-bold tabular-nums">
                              {st === "投稿済み" ? "✓ " : st === "失敗" ? "⚠ " : "⏰ "}{it.time}
                            </span>
                            <span className="block truncate opacity-95">{it.title || "（無題）"}</span>
                          </button>
                        );
                      }
                      const deco = chipDeco(it.memo.status);
                      return (
                        <button
                          key={`m-${it.id}`}
                          onClick={(e) => { e.stopPropagation(); openEdit(it.memo); }}
                          className="text-left rounded px-1 py-0.5 text-[10px] leading-tight hover:opacity-90 border border-dashed bg-transparent"
                          style={{ borderColor: colorFor(it.open_id), color: colorFor(it.open_id), opacity: deco.opacity }}
                        >
                          <span className="font-bold tabular-nums">{deco.mark}{it.time}</span>
                          <span className="block truncate">{it.title || "（無題）"}</span>
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
                  <th className="px-4 py-2.5">アカウント</th>
                  <th className="px-4 py-2.5 whitespace-nowrap">予約日時（LA）</th>
                  <th className="px-4 py-2.5">状態</th>
                  <th className="px-4 py-2.5">キャプション</th>
                  <th className="px-4 py-2.5">ハッシュタグ</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((it) => {
                  const isAuto = it.kind === "auto";
                  const status = isAuto ? it.post.status : it.memo.status;
                  const done = status === "投稿済み";
                  const accName = isAuto
                    ? it.post.account_name || nameFor(it.open_id)
                    : it.memo.account_name || nameFor(it.open_id);
                  return (
                    <tr
                      key={`${it.kind}-${it.id}`}
                      className={`border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/40 transition ${done ? "opacity-60" : ""}`}
                    >
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorFor(it.open_id) }}></span>
                          {accName}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">{fmtDate(it.date)} {it.time}</td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        {isAuto ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            status === "投稿済み" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                            : status === "失敗" ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                            : "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          }`}>
                            {status === "投稿済み" ? "✓ 投稿済み" : status === "失敗" ? "⚠ 失敗" : "⏰ 予約"}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-dashed border-gray-400 text-gray-500 dark:text-gray-400">
                            メモ
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 max-w-xs"><span className="line-clamp-2">{stripTags(it.title) || "（未入力）"}</span></td>
                      <td className="px-4 py-2.5">
                        <div className="flex flex-wrap gap-1">
                          {extractTags(it.title).map((t, i) => (
                            <span key={i} className="text-xs text-indigo-500 dark:text-indigo-400">{t}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <button
                          onClick={() => (it.kind === "auto" ? setDetail(it.post) : openEdit(it.memo))}
                          className="text-xs text-gray-500 dark:text-gray-400 underline hover:text-black dark:hover:text-white"
                        >
                          {it.kind === "auto" ? "詳細" : "編集"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {sortedItems.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-12 text-gray-400">予約がありません。「＋予約を追加」から、動画を選んで作成できます。</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-2">
        ⏰の予約は、時刻（LA）になると自動でTikTokに投稿されます（5分おきに確認）。日付クリックでメモを追加できます。
      </p>

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
              {form.editingId ? "メモを編集" : "メモを追加"}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-3 mb-4 leading-relaxed">
              メモは自動投稿されません。自動投稿したい場合は「＋予約を追加」から動画を選んで予約してください。
            </p>
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

      {/* 自動投稿の予約：詳細・取り消し */}
      {detail && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl w-full max-w-md p-6 text-black dark:text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="font-bold text-lg mb-4">
              {detail.status === "投稿済み" ? "✓ 投稿済み" : detail.status === "失敗" ? "⚠ 投稿に失敗しました" : "⏰ 予約（自動投稿）"}
            </h2>
            <dl className="text-sm divide-y divide-gray-200 dark:divide-gray-800 border-y border-gray-200 dark:border-gray-800">
              {[
                ["アカウント", detail.account_name || nameFor(detail.open_id)],
                ["予約日時（LA）", (() => { const la = utcToLA(detail.run_at); return `${fmtDate(la.date)} ${la.time}`; })()],
                ["公開範囲", 公開範囲ラベル[detail.privacy_level] || detail.privacy_level],
                ["キャプション", detail.title || "（未入力）"],
                ...(detail.video_size ? [["動画サイズ", `${(detail.video_size / 1048576).toFixed(1)} MB`]] : []),
                ...(detail.posted_at ? [["投稿した時刻（LA）", (() => { const la = utcToLA(detail.posted_at!); return `${fmtDate(la.date)} ${la.time}`; })()]] : []),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 py-2.5">
                  <dt className="text-gray-500 dark:text-gray-400 shrink-0">{k}</dt>
                  <dd className="text-right break-all">{v}</dd>
                </div>
              ))}
            </dl>

            {detail.error && (
              <div className="mt-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2.5 text-xs text-red-600 dark:text-red-400 leading-relaxed">
                <p className="font-bold mb-1">
                  {detail.status === "失敗" ? `失敗の理由（${detail.attempts}回試行）` : `前回の試行でエラー（${detail.attempts}回目・再試行します）`}
                </p>
                <p className="break-all">{detail.error}</p>
              </div>
            )}

            <div className="flex items-center justify-between mt-6">
              <button onClick={cancelDetail} disabled={busy} className="text-sm text-red-500 hover:text-red-600 disabled:opacity-40">
                {busy ? "処理中..." : detail.status === "予約" ? "予約を取り消す" : "記録を削除"}
              </button>
              <button
                onClick={() => setDetail(null)}
                className="border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-5 py-2 text-sm hover:border-black dark:hover:border-white transition"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
