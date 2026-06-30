"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">データを読み込み中...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">エラー: {error}</p>
          <button onClick={() => router.push("/")} className="bg-white text-black px-6 py-2 rounded-full font-bold">
            トップに戻る
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 bg-black border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <span className="text-black font-bold text-xl">P</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">Poston</span>
        </div>
        <div className="flex items-center gap-4">
          <a href="/analytics" className="text-sm text-gray-300 hover:text-white transition border border-gray-700 hover:border-white px-4 py-1.5 rounded-full">
            アナリティクス
          </a>
          {user && (
            <div className="flex items-center gap-3">
              {user.avatar_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatar_url} alt={user.display_name} className="w-9 h-9 rounded-full" />
              )}
              <span className="text-gray-300 text-sm">{user.display_name}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="text-gray-400 hover:text-white text-sm border border-gray-700 px-4 py-2 rounded-full transition"
          >
            ログアウト
          </button>
        </div>
      </header>

      {/* Stats */}
      {user && (
        <section className="px-8 py-8 border-b border-gray-800">
          <h2 className="text-xl font-bold mb-4">アカウント概要</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold">{user.follower_count?.toLocaleString() ?? "-"}</p>
              <p className="text-gray-400 text-sm mt-1">フォロワー</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold">{user.video_count?.toLocaleString() ?? videos.length}</p>
              <p className="text-gray-400 text-sm mt-1">動画数</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold">
                {videos.reduce((s, v) => s + (v.view_count || 0), 0).toLocaleString()}
              </p>
              <p className="text-gray-400 text-sm mt-1">総再生数</p>
            </div>
            <div className="bg-gray-900 rounded-xl p-5 text-center">
              <p className="text-3xl font-bold">
                {videos.reduce((s, v) => s + (v.like_count || 0), 0).toLocaleString()}
              </p>
              <p className="text-gray-400 text-sm mt-1">総いいね数</p>
            </div>
          </div>
        </section>
      )}

      {/* Videos */}
      <section className="px-8 py-8 flex-1">
        <h2 className="text-xl font-bold mb-6">動画一覧</h2>
        {videos.length === 0 ? (
          <p className="text-gray-400">動画が見つかりませんでした</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="bg-gray-900 rounded-xl overflow-hidden">
                {video.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.cover_image_url}
                    alt={video.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-4">
                  <p className="text-sm font-medium mb-3 line-clamp-2">{video.title || "（タイトルなし）"}</p>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs text-gray-400">
                    <div>
                      <p className="text-white font-bold text-base">{video.view_count?.toLocaleString() ?? "-"}</p>
                      <p>再生</p>
                    </div>
                    <div>
                      <p className="text-white font-bold text-base">{video.like_count?.toLocaleString() ?? "-"}</p>
                      <p>いいね</p>
                    </div>
                    <div>
                      <p className="text-white font-bold text-base">{video.comment_count?.toLocaleString() ?? "-"}</p>
                      <p>コメント</p>
                    </div>
                    <div>
                      <p className="text-white font-bold text-base">{video.share_count?.toLocaleString() ?? "-"}</p>
                      <p>シェア</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="bg-black border-t border-gray-800 text-gray-500 text-sm text-center py-6">
        <p>© 2026 Poston. Contact: otuka.y@al-bo.io</p>
      </footer>
    </main>
  );
}
