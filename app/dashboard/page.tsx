"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "../components/AppShell";
import AccountAvatar from "../components/AccountAvatar";
import { getValidAccessToken, getStoredToken, setAccountProfile, logoutActiveAccount } from "../lib/tiktokToken";

interface Video {
  id: string;
  title: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  share_count: number;
  create_time: number;
  cover_image_url: string;
}

interface UserInfo {
  display_name: string;
  avatar_url: string;
  follower_count: number;
  following_count: number;
  likes_count: number;
  video_count: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [読込中, set読込中] = useState(true);
  const [エラー, setエラー] = useState("");
  const [要再ログイン, set要再ログイン] = useState(false);
  // 保存済みのアカウント情報（画面を即座に表示するために使う）
  const [保存名, set保存名] = useState("");
  const [保存アバター, set保存アバター] = useState<string | undefined>(undefined);

  useEffect(() => {
    // 1) まず保存済みの情報で即座に画面を描画する
    const stored = getStoredToken();
    set保存名(stored?.display_name || "");
    set保存アバター(stored?.avatar_url);
    if (!stored) {
      set要再ログイン(true);
      set読込中(false);
      return;
    }

    // 2) 実データはバックグラウンドで取得して順次反映する
    (async () => {
      const token = await getValidAccessToken();
      if (!token) {
        set要再ログイン(true);
        set読込中(false);
        return;
      }
      const { access_token, open_id } = token;
      try {
        const [userData, videoData] = await Promise.all([
          fetch(`/api/user?access_token=${access_token}&open_id=${open_id}`).then((r) => r.json()),
          fetch(`/api/videos?access_token=${access_token}&open_id=${open_id}`).then((r) => r.json()),
        ]);
        if (userData.error) throw new Error(userData.error);
        setUser(userData);
        setVideos(videoData.videos || []);
        setAccountProfile(open_id, userData.display_name, userData.avatar_url);
      } catch (e) {
        setエラー(e instanceof Error ? e.message : String(e));
      } finally {
        set読込中(false);
      }
    })();
  }, [router]);

  const handleLogout = async () => {
    const token = getStoredToken();
    if (token?.access_token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token: token.access_token }),
      });
    }
    // アクティブなアカウントだけログアウト。他のアカウントが残っていればそちらに切替。
    const remaining = logoutActiveAccount();
    if (remaining > 0) {
      window.location.reload();
    } else {
      router.push("/");
    }
  };

  const 表示名 = user?.display_name || 保存名 || "アカウント";
  const 表示アバター = user?.avatar_url || 保存アバター;
  const 合計 = (key: "view_count" | "like_count") =>
    videos.reduce((s, v) => s + (v[key] || 0), 0).toLocaleString();

  // 数値がまだ無い間はプレースホルダを出す（画面は先に表示する）
  const 数値 = (v: string | number | undefined, ready: boolean) =>
    ready ? String(v) : "—";

  const カード = [
    { label: "フォロワー", value: 数値(user?.follower_count?.toLocaleString(), !!user) },
    { label: "動画数", value: 数値((user?.video_count ?? videos.length)?.toLocaleString(), !!user) },
    { label: "総再生数", value: 数値(合計("view_count"), videos.length > 0 || !読込中) },
    { label: "総いいね数", value: 数値(合計("like_count"), videos.length > 0 || !読込中) },
  ];

  return (
    <AppShell current="dashboard" title="ダッシュボード">
      <section className="px-8 py-8 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <AccountAvatar src={表示アバター} name={表示名} size={40} />
            <div className="min-w-0">
              <p className="font-bold truncate">{表示名}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                TikTokアカウント
                {読込中 && <span className="ml-2 text-xs text-gray-400">読み込み中...</span>}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="shrink-0 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-sm border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-full transition"
          >
            ログアウト
          </button>
        </div>

        {要再ログイン && (
          <div className="mb-4 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-300 dark:border-yellow-800 rounded-xl px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300 flex items-center justify-between gap-4 flex-wrap">
            <span>🔑 このアカウントのログイン情報が無効です。サイドバーで切り替えるか、ログインし直してください。</span>
            <a href="/" className="underline font-bold whitespace-nowrap">ログインし直す</a>
          </div>
        )}
        {エラー && !要再ログイン && (
          <div className="mb-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 flex items-center justify-between gap-4 flex-wrap">
            <span>データを取得できませんでした：{エラー}</span>
            <a href="/" className="underline font-bold whitespace-nowrap">ログインし直す</a>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {カード.map((card) => (
            <div key={card.label} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 text-center">
              <p className={`text-3xl font-bold tabular-nums ${card.value === "—" ? "text-gray-300 dark:text-gray-700" : ""}`}>
                {card.value}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-8 py-8 flex-1">
        <h2 className="text-xl font-bold mb-6">動画一覧</h2>
        {読込中 ? (
          // 読み込み中はスケルトンを表示（画面が空にならないように）
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden animate-pulse">
                <div className="w-full h-48 bg-gray-200 dark:bg-gray-800"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">動画が見つかりませんでした</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
                {video.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={video.cover_image_url} alt={video.title} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <p className="text-sm font-medium mb-3 line-clamp-2">{video.title || "（タイトルなし）"}</p>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    {[
                      { label: "再生", value: video.view_count },
                      { label: "いいね", value: video.like_count },
                      { label: "コメント", value: video.comment_count },
                      { label: "シェア", value: video.share_count },
                    ].map((stat) => (
                      <div key={stat.label}>
                        <p className="font-bold text-base text-black dark:text-white">{stat.value?.toLocaleString() ?? "-"}</p>
                        <p>{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-gray-200 dark:border-gray-800 text-gray-400 text-sm text-center py-6">
        © 2026 Poston
      </footer>
    </AppShell>
  );
}
