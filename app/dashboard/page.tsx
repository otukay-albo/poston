"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../components/Header";

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const tokenData = localStorage.getItem("tiktok_token");
    if (!tokenData) {
      router.push("/");
      return;
    }

    const { access_token, open_id } = JSON.parse(tokenData);
    Promise.all([
      fetch(`/api/user?access_token=${access_token}&open_id=${open_id}`).then((r) => r.json()),
      fetch(`/api/videos?access_token=${access_token}&open_id=${open_id}`).then((r) => r.json()),
    ])
      .then(([userData, videoData]) => {
        if (userData.error) throw new Error(userData.error);
        setUser(userData);
        setVideos(videoData.videos || []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [router]);

  const handleLogout = async () => {
    const tokenData = localStorage.getItem("tiktok_token");
    if (tokenData) {
      const { access_token } = JSON.parse(tokenData);
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ access_token }),
      });
    }
    localStorage.removeItem("tiktok_token");
    router.push("/");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-black dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">データを読み込み中...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">エラー: {error}</p>
          <button onClick={() => router.push("/")} className="bg-black dark:bg-white text-white dark:text-black px-6 py-2 rounded-full font-bold">
            トップに戻る
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex flex-col">
      <Header current="dashboard" />

      {user && (
        <section className="px-8 py-8 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {user.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={user.display_name} className="w-10 h-10 rounded-full" />
              )}
              <div>
                <p className="font-bold">{user.display_name}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm">TikTokアカウント</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white text-sm border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-full transition"
            >
              ログアウト
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "フォロワー", value: user.follower_count?.toLocaleString() ?? "-" },
              { label: "動画数", value: (user.video_count ?? videos.length).toLocaleString() },
              { label: "総再生数", value: videos.reduce((s, v) => s + (v.view_count || 0), 0).toLocaleString() },
              { label: "総いいね数", value: videos.reduce((s, v) => s + (v.like_count || 0), 0).toLocaleString() },
            ].map((card) => (
              <div key={card.label} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 text-center">
                <p className="text-3xl font-bold">{card.value}</p>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{card.label}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-8 py-8 flex-1">
        <h2 className="text-xl font-bold mb-6">動画一覧</h2>
        {videos.length === 0 ? (
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
    </main>
  );
}
