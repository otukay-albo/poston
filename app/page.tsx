"use client";

import { useState } from "react";

async function generatePKCE() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const codeVerifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const codeChallenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return { codeVerifier, codeChallenge };
}

export default function Home() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { codeVerifier, codeChallenge } = await generatePKCE();
    sessionStorage.setItem("code_verifier", codeVerifier);

    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
    const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI;
    const scope = "user.info.basic,user.info.stats,video.list";

    const authUrl =
      `https://www.tiktok.com/v2/auth/authorize/?` +
      `client_key=${clientKey}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri || "")}` +
      `&state=login` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256`;

    window.location.href = authUrl;
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-8 py-5 bg-black border-b border-gray-800">
        <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
          <span className="text-black font-bold text-xl">P</span>
        </div>
        <span className="text-white font-bold text-xl tracking-wide">Poston</span>
      </header>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center flex-1 px-6 text-center py-20">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-8">
          <span className="text-black font-extrabold text-5xl">P</span>
        </div>
        <h1 className="text-5xl font-extrabold mb-6">Poston</h1>
        <p className="text-gray-400 text-lg max-w-lg mb-10 leading-relaxed">
          TikTokアカウントを一元管理。動画の自動投稿・アナリティクス取得を効率化する企業向けツールです。
        </p>
        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-white text-black font-bold px-8 py-4 rounded-full text-lg hover:bg-gray-200 transition disabled:opacity-50"
        >
          {loading ? "移動中..." : "TikTokでログイン"}
        </button>
      </section>

      {/* Features */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8 pb-20 max-w-5xl mx-auto w-full">
        <div className="bg-gray-900 rounded-2xl p-8">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="font-bold text-lg mb-2">アナリティクス取得</h3>
          <p className="text-gray-400 text-sm leading-relaxed">複数アカウントの再生数・いいね数・エンゲージメント率を30分ごとに自動取得</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8">
          <div className="text-4xl mb-4">🚀</div>
          <h3 className="font-bold text-lg mb-2">自動投稿</h3>
          <p className="text-gray-400 text-sm leading-relaxed">Google Driveの動画・画像をスケジュール設定して自動でTikTokに投稿</p>
        </div>
        <div className="bg-gray-900 rounded-2xl p-8">
          <div className="text-4xl mb-4">👥</div>
          <h3 className="font-bold text-lg mb-2">複数アカウント管理</h3>
          <p className="text-gray-400 text-sm leading-relaxed">複数のTikTokアカウントをスプレッドシートから一元管理</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-gray-800 text-gray-500 text-sm text-center py-6 px-4">
        <p>
          <a href="/privacy" className="hover:text-white mx-3">Privacy Policy</a>
          <a href="/terms" className="hover:text-white mx-3">Terms of Service</a>
        </p>
        <p className="mt-3">© 2026 Poston. Contact: otuka.y@al-bo.io</p>
      </footer>
    </main>
  );
}
