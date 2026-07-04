"use client";

import { useState, useRef, useEffect } from "react";
import Header from "../components/Header";

const 公開設定一覧 = [
  { value: "PUBLIC_TO_EVERYONE", label: "全員に公開" },
  { value: "MUTUAL_FOLLOW_FRIENDS", label: "相互フォロワーのみ" },
  { value: "SELF_ONLY", label: "非公開" },
];

type ステップ = "編集" | "確認" | "完了";

export default function 投稿ページ() {
  const [ステップ, setステップ] = useState<ステップ>("編集");
  const [動画ファイル, set動画ファイル] = useState<File | null>(null);
  const [動画URL, set動画URL] = useState<string | null>(null);
  const [タイトル, setタイトル] = useState("");
  const [公開設定, set公開設定] = useState("PUBLIC_TO_EVERYONE");
  const [デュエット無効, setデュエット無効] = useState(false);
  const [スティッチ無効, setスティッチ無効] = useState(false);
  const [コメント無効, setコメント無効] = useState(false);
  const [投稿中, set投稿中] = useState(false);
  const [エラー, setエラー] = useState("");
  const [アカウント名, setアカウント名] = useState("");
  const [アバター, setアバター] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tokenData = localStorage.getItem("tiktok_token");
    if (!tokenData) return;
    const { access_token, open_id } = JSON.parse(tokenData);
    fetch(`/api/user?access_token=${access_token}&open_id=${open_id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.display_name) setアカウント名(d.display_name);
        if (d.avatar_url) setアバター(d.avatar_url);
      })
      .catch(() => {});
  }, []);

  const ファイル選択 = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (動画URL) URL.revokeObjectURL(動画URL);
    set動画ファイル(file);
    set動画URL(URL.createObjectURL(file));
    setエラー("");
  };

  const 動画削除 = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (動画URL) URL.revokeObjectURL(動画URL);
    set動画ファイル(null);
    set動画URL(null);
    setエラー("");
    if (fileRef.current) fileRef.current.value = "";
  };

  const 投稿実行 = async () => {
    if (!動画ファイル) return;
    set投稿中(true);
    setエラー("");

    const tokenData = localStorage.getItem("tiktok_token");
    if (!tokenData) {
      setエラー("ログインが必要です");
      set投稿中(false);
      return;
    }

    const { access_token } = JSON.parse(tokenData);

    try {
      // ステップ1: TikTokにアップロード先URLを発行してもらう
      const initRes = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token,
          title: タイトル,
          privacy_level: 公開設定,
          disable_duet: デュエット無効,
          disable_stitch: スティッチ無効,
          disable_comment: コメント無効,
          video_size: 動画ファイル.size,
        }),
      });
      const initData = await initRes.json();
      if (!initRes.ok || initData.error) {
        setエラー(initData.error || `投稿の初期化に失敗しました (${initRes.status})`);
        set投稿中(false);
        return;
      }

      // ステップ2: 動画をTikTokへ直接アップロード（Vercelを経由しない）
      const putRes = await fetch(initData.upload_url, {
        method: "PUT",
        headers: {
          "Content-Type": "video/mp4",
          "Content-Range": `bytes 0-${動画ファイル.size - 1}/${動画ファイル.size}`,
        },
        body: 動画ファイル,
      });
      if (!putRes.ok) {
        setエラー(`動画のアップロードに失敗しました (${putRes.status})`);
        set投稿中(false);
        return;
      }

      setステップ("完了");
    } catch (e) {
      setエラー("投稿に失敗しました: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      set投稿中(false);
    }
  };

  const リセット = () => {
    if (動画URL) URL.revokeObjectURL(動画URL);
    setステップ("編集");
    set動画ファイル(null);
    set動画URL(null);
    setタイトル("");
    set公開設定("PUBLIC_TO_EVERYONE");
    setエラー("");
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col">
      <Header current="post" />

      <div className="flex-1 max-w-xl mx-auto w-full px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current shrink-0">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.26 8.26 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z"/>
            </svg>
            <span className="font-bold text-lg">TikTokに投稿</span>
          </div>
          {アカウント名 && (
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1.5">
              {アバター && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={アバター} alt={アカウント名} className="w-6 h-6 rounded-full" />
              )}
              <span className="text-sm font-medium">{アカウント名}</span>
            </div>
          )}
        </div>

        {ステップ === "編集" && (
          <div className="space-y-6">
            <div className="relative border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-10 text-center transition hover:border-gray-500 dark:hover:border-gray-400">
              {動画URL ? (
                <>
                  <video src={動画URL} className="max-h-52 mx-auto rounded-lg" controls />
                  <button
                    onClick={動画削除}
                    aria-label="動画を削除"
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition"
                  >
                    ✕
                  </button>
                  <div className="mt-4 flex items-center justify-center gap-4">
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="text-sm text-gray-500 dark:text-gray-400 underline hover:text-black dark:hover:text-white"
                    >
                      別の動画に変更
                    </button>
                    <button
                      onClick={動画削除}
                      className="text-sm text-red-500 underline hover:text-red-600"
                    >
                      削除
                    </button>
                  </div>
                </>
              ) : (
                <div onClick={() => fileRef.current?.click()} className="cursor-pointer">
                  <p className="text-3xl mb-3">🎬</p>
                  <p className="font-bold mb-1">動画を選択してください</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">MP4形式・最大500MB</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={ファイル選択} />
            </div>

            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">タイトル・キャプション</label>
              <textarea
                value={タイトル}
                onChange={(e) => setタイトル(e.target.value)}
                placeholder="#ハッシュタグ を含めて入力"
                rows={3}
                maxLength={2200}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
              />
              <p className="text-xs text-gray-400 dark:text-gray-600 text-right mt-1">{タイトル.length} / 2200</p>
            </div>

            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">公開設定</label>
              <select
                value={公開設定}
                onChange={(e) => set公開設定(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 text-sm"
              >
                {公開設定一覧.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-3">インタラクション設定</label>
              <div className="space-y-3">
                {[
                  { label: "デュエットを無効にする", value: デュエット無効, set: setデュエット無効 },
                  { label: "スティッチを無効にする", value: スティッチ無効, set: setスティッチ無効 },
                  { label: "コメントを無効にする", value: コメント無効, set: setコメント無効 },
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.value}
                      onChange={(e) => item.set(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <a href="/dashboard" className="flex-1 text-center border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full py-3 text-sm hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition">
                キャンセル
              </a>
              <button
                onClick={() => setステップ("確認")}
                disabled={!動画ファイル}
                className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-full py-3 text-sm font-bold disabled:opacity-30 hover:opacity-80 transition"
              >
                内容を確認する
              </button>
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-600 text-center">
              投稿することで、TikTokの
              <a href="https://www.tiktok.com/legal/terms-of-service" target="_blank" rel="noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-400">利用規約</a>
              および
              <a href="https://www.tiktok.com/legal/privacy-policy" target="_blank" rel="noreferrer" className="underline hover:text-gray-600 dark:hover:text-gray-400">プライバシーポリシー</a>
              に同意したものとみなされます。
            </p>
          </div>
        )}

        {ステップ === "確認" && (
          <div className="space-y-6">
            <h2 className="font-bold text-lg">投稿内容の確認</h2>

            {動画URL && (
              <video src={動画URL} className="w-full rounded-xl max-h-64 object-contain bg-gray-100 dark:bg-gray-900" controls />
            )}

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl divide-y divide-gray-200 dark:divide-gray-800 text-sm">
              {[
                { label: "タイトル", value: タイトル || "（未入力）" },
                { label: "公開設定", value: 公開設定一覧.find((o) => o.value === 公開設定)?.label ?? "" },
                { label: "デュエット", value: デュエット無効 ? "無効" : "有効" },
                { label: "スティッチ", value: スティッチ無効 ? "無効" : "有効" },
                { label: "コメント", value: コメント無効 ? "無効" : "有効" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between px-5 py-3">
                  <span className="text-gray-500 dark:text-gray-400">{row.label}</span>
                  <span className="max-w-xs text-right">{row.value}</span>
                </div>
              ))}
            </div>

            {エラー && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
                {エラー}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setステップ("編集")}
                className="flex-1 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full py-3 text-sm hover:border-black dark:hover:border-white transition"
              >
                編集に戻る
              </button>
              <button
                onClick={投稿実行}
                disabled={投稿中}
                className="flex-1 bg-black dark:bg-white text-white dark:text-black rounded-full py-3 text-sm font-bold disabled:opacity-30 hover:opacity-80 transition"
              >
                {投稿中 ? "投稿中..." : "TikTokに投稿する"}
              </button>
            </div>
          </div>
        )}

        {ステップ === "完了" && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">✅</p>
            <h2 className="text-2xl font-bold mb-2">投稿が完了しました</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-8">TikTokに動画を投稿しました</p>
            <div className="flex gap-3 justify-center">
              <a href="/dashboard" className="border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-full px-6 py-3 text-sm hover:border-black dark:hover:border-white transition">
                ダッシュボードへ
              </a>
              <button
                onClick={リセット}
                className="bg-black dark:bg-white text-white dark:text-black rounded-full px-6 py-3 text-sm font-bold hover:opacity-80 transition"
              >
                続けて投稿する
              </button>
            </div>
          </div>
        )}
      </div>

      <footer className="border-t border-gray-200 dark:border-gray-800 text-gray-400 dark:text-gray-600 text-sm text-center py-6">
        © 2026 Poston
      </footer>
    </main>
  );
}
