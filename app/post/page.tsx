"use client";

import { useState, useRef, useEffect } from "react";
import Header from "../components/Header";
import { getValidAccessToken, clearToken, setAccountProfile } from "../lib/tiktokToken";

const 公開設定ラベル: Record<string, string> = {
  PUBLIC_TO_EVERYONE: "全員に公開",
  MUTUAL_FOLLOW_FRIENDS: "相互フォロワーのみ",
  FOLLOWER_OF_CREATOR: "フォロワーのみ",
  SELF_ONLY: "自分のみ（非公開）",
};

// TikTok Content Posting API の審査（App review）が未完了のため、
// 投稿は「自分のみ（非公開）」に限定される。
// 審査通過後に true にすると、アカウントが許可する他の公開範囲も選べるようになる。
const 審査済み = false;

type ステップ = "編集" | "確認" | "完了";

export default function 投稿ページ() {
  const [ステップ, setステップ] = useState<ステップ>("編集");
  const [動画ファイル, set動画ファイル] = useState<File | null>(null);
  const [動画URL, set動画URL] = useState<string | null>(null);
  const [タイトル, setタイトル] = useState("");
  const [公開設定, set公開設定] = useState("");
  const [デュエット無効, setデュエット無効] = useState(false);
  const [スティッチ無効, setスティッチ無効] = useState(false);
  const [コメント無効, setコメント無効] = useState(false);
  const [投稿中, set投稿中] = useState(false);
  const [エラー, setエラー] = useState("");
  const [アカウント名, setアカウント名] = useState("");
  const [アバター, setアバター] = useState("");
  const [公開設定候補, set公開設定候補] = useState<string[]>([]);
  const [コメント不可, setコメント不可] = useState(false);
  const [デュエット不可, setデュエット不可] = useState(false);
  const [スティッチ不可, setスティッチ不可] = useState(false);
  const [再ログイン必要, set再ログイン必要] = useState(false);
  const [読込中, set読込中] = useState(true);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    (async () => {
      const token = await getValidAccessToken();
      if (!token) {
        set再ログイン必要(true);
        set読込中(false);
        return;
      }
      try {
        const d = await fetch("/api/creator-info", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: token.access_token }),
        }).then((r) => r.json());
        if (d.error) {
          // 投稿権限（video.publish）が無い旧トークン → 再ログインが必要
          set再ログイン必要(true);
          return;
        }
        if (d.creator_nickname) setアカウント名(d.creator_nickname);
        if (d.creator_avatar_url) setアバター(d.creator_avatar_url);
        // アカウント切替UIの表示用に名前・アイコンを保存
        setAccountProfile(token.open_id, d.creator_nickname, d.creator_avatar_url);
        // TikTok UXガイドライン: creator_info の privacy_level_options をそのまま表示し、
        // デフォルト値は設定しない（ユーザーが必ず手動で選択する）
        set公開設定候補(d.privacy_level_options || []);
        setコメント不可(!!d.comment_disabled);
        setデュエット不可(!!d.duet_disabled);
        setスティッチ不可(!!d.stitch_disabled);
      } catch {
        set再ログイン必要(true);
      } finally {
        set読込中(false);
      }
    })();
  }, []);

  const 再ログイン = () => {
    clearToken();
    window.location.href = "/";
  };

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

    const token = await getValidAccessToken();
    if (!token) {
      setエラー("ログインが必要です");
      set投稿中(false);
      return;
    }

    const access_token = token.access_token;

    try {
      // ステップ1: TikTokにアップロード先URLを発行してもらう
      const initRes = await fetch("/api/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token,
          title: タイトル,
          privacy_level: 公開設定,
          disable_duet: デュエット無効 || デュエット不可,
          disable_stitch: スティッチ無効 || スティッチ不可,
          disable_comment: コメント無効 || コメント不可,
          video_size: 動画ファイル.size,
        }),
      });
      const initData = await initRes.json();
      if (!initRes.ok || initData.error) {
        const codeStr = initData.code ? `［${initData.code}］` : "";
        setエラー((initData.error || `投稿の初期化に失敗しました (${initRes.status})`) + codeStr);
        set投稿中(false);
        return;
      }

      // ステップ2: 動画をTikTokへ直接アップロード（Vercelを経由しない）
      const putRes = await fetch(initData.upload_url, {
        method: "PUT",
        headers: {
          // ファイルの実際の形式に合わせる（MP4 / MOV 両対応）
          "Content-Type": 動画ファイル.type || "video/mp4",
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
    set公開設定("");
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

        {読込中 && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {!読込中 && 再ログイン必要 && (
          <div className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-300 dark:border-yellow-800 rounded-xl p-8 text-center space-y-4">
            <p className="text-4xl">🔑</p>
            <p className="font-bold text-lg">投稿するには再ログインが必要です</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              現在のログインには投稿権限（video.publish）が含まれていません。<br />
              一度ログアウトし、投稿権限を許可した状態でログインし直してください。
            </p>
            <button
              onClick={再ログイン}
              className="bg-black dark:bg-white text-white dark:text-black rounded-full px-8 py-3 text-sm font-bold hover:opacity-80 transition"
            >
              再ログインする
            </button>
          </div>
        )}

        {!読込中 && !再ログイン必要 && ステップ === "編集" && (
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
                <option value="" disabled>公開範囲を選択してください</option>
                {公開設定候補.map((v) => (
                  <option key={v} value={v}>{公開設定ラベル[v] || v}</option>
                ))}
              </select>
              {!審査済み && (
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-2 leading-relaxed">
                  ※ TikTok審査前のため、①投稿アカウントを「非公開アカウント」に設定し、②公開範囲「自分のみ」を選択した場合のみ投稿できます。公開投稿には審査（App review）の通過が必要です。
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm text-gray-500 dark:text-gray-400 mb-3">インタラクション設定</label>
              <div className="space-y-3">
                {[
                  { label: "デュエットを無効にする", value: デュエット無効, set: setデュエット無効, locked: デュエット不可 },
                  { label: "スティッチを無効にする", value: スティッチ無効, set: setスティッチ無効, locked: スティッチ不可 },
                  { label: "コメントを無効にする", value: コメント無効, set: setコメント無効, locked: コメント不可 },
                ].map((item) => (
                  <label key={item.label} className={`flex items-center gap-3 ${item.locked ? "opacity-60" : "cursor-pointer"}`}>
                    <input
                      type="checkbox"
                      checked={item.value || item.locked}
                      disabled={item.locked}
                      onChange={(e) => item.set(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {item.label}
                      {item.locked && <span className="text-xs text-gray-400 ml-1">（アカウント設定で無効）</span>}
                    </span>
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
                disabled={!動画ファイル || !公開設定}
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

        {!再ログイン必要 && ステップ === "確認" && (
          <div className="space-y-6">
            <h2 className="font-bold text-lg">投稿内容の確認</h2>

            {動画URL && (
              <video src={動画URL} className="w-full rounded-xl max-h-64 object-contain bg-gray-100 dark:bg-gray-900" controls />
            )}

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl divide-y divide-gray-200 dark:divide-gray-800 text-sm">
              {[
                { label: "タイトル", value: タイトル || "（未入力）" },
                { label: "公開設定", value: 公開設定ラベル[公開設定] || 公開設定 },
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

            <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed">
              投稿することで、あなたはTikTokの
              <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank" rel="noreferrer" className="underline hover:text-black dark:hover:text-white">音楽利用の確認事項（Music Usage Confirmation）</a>
              に同意したものとみなされます。
            </p>

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
