"use client";

import { useState, useRef } from "react";

const PRIVACY_OPTIONS = [
  { value: "PUBLIC_TO_EVERYONE", label: "全員に公開" },
  { value: "MUTUAL_FOLLOW_FRIENDS", label: "相互フォロワーのみ" },
  { value: "SELF_ONLY", label: "非公開" },
];

type Step = "edit" | "preview" | "done";

export default function PostPage() {
  const [step, setStep] = useState<Step>("edit");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [privacy, setPrivacy] = useState("PUBLIC_TO_EVERYONE");
  const [disableDuet, setDisableDuet] = useState(false);
  const [disableStitch, setDisableStitch] = useState(false);
  const [disableComment, setDisableComment] = useState(false);
  const [posting, setPosting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
  };

  const handlePost = async () => {
    if (!videoFile) return;
    setPosting(true);

    const tokenData = localStorage.getItem("tiktok_token");
    if (!tokenData) {
      setResult({ success: false, message: "ログインが必要です" });
      setPosting(false);
      return;
    }

    const { access_token } = JSON.parse(tokenData);
    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("access_token", access_token);
    formData.append("title", title);
    formData.append("privacy_level", privacy);
    formData.append("disable_duet", String(disableDuet));
    formData.append("disable_stitch", String(disableStitch));
    formData.append("disable_comment", String(disableComment));

    try {
      const res = await fetch("/api/post", { method: "POST", body: formData });
      const data = await res.json();
      if (data.error) {
        setResult({ success: false, message: data.error });
      } else {
        setResult({ success: true, message: "投稿が完了しました！" });
        setStep("done");
      }
    } catch {
      setResult({ success: false, message: "投稿に失敗しました" });
    } finally {
      setPosting(false);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
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
          <a href="/analysis" className="text-gray-400 hover:text-white transition">傾向分析</a>
          <a href="/post" className="text-white font-bold border-b border-white pb-0.5">投稿</a>
        </nav>
      </header>

      <div className="flex-1 px-6 md:px-10 py-8 max-w-2xl mx-auto w-full">

        {/* TikTokブランド表示（UXガイドライン必須） */}
        <div className="flex items-center gap-2 mb-6">
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
            <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.26 8.26 0 004.84 1.56V6.79a4.85 4.85 0 01-1.07-.1z"/>
          </svg>
          <span className="text-white font-bold">TikTokに投稿</span>
        </div>

        {step === "edit" && (
          <div className="space-y-6">
            {/* 動画選択 */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-gray-600 rounded-xl p-10 text-center cursor-pointer hover:border-white transition"
            >
              {videoUrl ? (
                <video src={videoUrl} className="max-h-48 mx-auto rounded-lg" controls />
              ) : (
                <>
                  <p className="text-4xl mb-3">🎬</p>
                  <p className="text-white font-bold mb-1">動画を選択</p>
                  <p className="text-gray-400 text-sm">MP4形式、最大500MB</p>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* タイトル */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">タイトル・キャプション</label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="#ハッシュタグ を含めて入力してください"
                rows={3}
                maxLength={2200}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:border-white"
              />
              <p className="text-xs text-gray-500 text-right mt-1">{title.length}/2200</p>
            </div>

            {/* 公開設定 */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">公開設定</label>
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-4 py-3 text-sm"
              >
                {PRIVACY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* インタラクション設定 */}
            <div>
              <label className="block text-sm text-gray-400 mb-3">インタラクション設定</label>
              <div className="space-y-3">
                {[
                  { label: "デュエットを無効にする", value: disableDuet, set: setDisableDuet },
                  { label: "スティッチを無効にする", value: disableStitch, set: setDisableStitch },
                  { label: "コメントを無効にする", value: disableComment, set: setDisableComment },
                ].map((item) => (
                  <label key={item.label} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.value}
                      onChange={(e) => item.set(e.target.checked)}
                      className="w-4 h-4 accent-white"
                    />
                    <span className="text-sm text-gray-300">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* ボタン */}
            <div className="flex gap-3 pt-2">
              <a
                href="/dashboard"
                className="flex-1 text-center border border-gray-700 text-gray-300 rounded-full py-3 text-sm hover:border-white hover:text-white transition"
              >
                キャンセル
              </a>
              <button
                onClick={() => setStep("preview")}
                disabled={!videoFile}
                className="flex-1 bg-white text-black rounded-full py-3 text-sm font-bold disabled:opacity-40 hover:bg-gray-200 transition"
              >
                プレビュー確認
              </button>
            </div>

            {/* 利用規約（UXガイドライン必須） */}
            <p className="text-xs text-gray-500 text-center pt-2">
              投稿することで、TikTokの
              <a href="https://www.tiktok.com/legal/terms-of-service" target="_blank" rel="noreferrer" className="underline hover:text-white">利用規約</a>
              および
              <a href="https://www.tiktok.com/legal/privacy-policy" target="_blank" rel="noreferrer" className="underline hover:text-white">プライバシーポリシー</a>
              に同意したものとみなされます。
            </p>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-6">
            <h2 className="font-bold text-lg">投稿内容の確認</h2>

            {videoUrl && (
              <video src={videoUrl} className="w-full rounded-xl max-h-72 object-contain bg-gray-900" controls />
            )}

            <div className="bg-gray-900 rounded-xl p-5 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">タイトル</span>
                <span className="text-white max-w-xs text-right">{title || "（未入力）"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">公開設定</span>
                <span className="text-white">{PRIVACY_OPTIONS.find((o) => o.value === privacy)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">デュエット</span>
                <span className="text-white">{disableDuet ? "無効" : "有効"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">スティッチ</span>
                <span className="text-white">{disableStitch ? "無効" : "有効"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">コメント</span>
                <span className="text-white">{disableComment ? "無効" : "有効"}</span>
              </div>
            </div>

            {result && !result.success && (
              <div className="bg-red-900/30 border border-red-700 rounded-xl p-4 text-red-400 text-sm">
                {result.message}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("edit")}
                className="flex-1 border border-gray-700 text-gray-300 rounded-full py-3 text-sm hover:border-white hover:text-white transition"
              >
                編集に戻る
              </button>
              <button
                onClick={handlePost}
                disabled={posting}
                className="flex-1 bg-white text-black rounded-full py-3 text-sm font-bold disabled:opacity-40 hover:bg-gray-200 transition"
              >
                {posting ? "投稿中..." : "TikTokに投稿する"}
              </button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-2xl font-bold mb-2">投稿完了！</h2>
            <p className="text-gray-400 mb-8">TikTokへの投稿が完了しました</p>
            <div className="flex gap-3 justify-center">
              <a href="/dashboard" className="border border-gray-700 text-gray-300 rounded-full px-6 py-3 text-sm hover:border-white hover:text-white transition">
                ダッシュボードへ
              </a>
              <button
                onClick={() => { setStep("edit"); setVideoFile(null); setVideoUrl(null); setTitle(""); setResult(null); }}
                className="bg-white text-black rounded-full px-6 py-3 text-sm font-bold hover:bg-gray-200 transition"
              >
                続けて投稿する
              </button>
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
