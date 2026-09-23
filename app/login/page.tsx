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

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { codeVerifier, codeChallenge } = await generatePKCE();
    sessionStorage.setItem("code_verifier", codeVerifier);

    const clientKey = process.env.NEXT_PUBLIC_TIKTOK_CLIENT_KEY;
    // 環境変数があればそれを使う（サンドボックス切替や別ドメイン展開に対応）
    const redirectUri =
      process.env.NEXT_PUBLIC_REDIRECT_URI || "https://poston-app-five.vercel.app/callback";
    // 要求するスコープ。サンドボックス等で構成が違う場合は
    // 環境変数 NEXT_PUBLIC_TIKTOK_SCOPES で上書きできる
    // video.upload（下書き送信）はバンドルされていても明示的に要求しないと
    // 付与されないため、必ず含める
    const scope =
      process.env.NEXT_PUBLIC_TIKTOK_SCOPES ||
      "user.info.basic,user.info.stats,video.list,video.publish,video.upload";

    const authUrl =
      `https://www.tiktok.com/v2/auth/authorize/?` +
      `client_key=${clientKey}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&response_type=code` +
      `&redirect_uri=${encodeURIComponent(redirectUri || "")}` +
      `&state=login` +
      `&code_challenge=${codeChallenge}` +
      `&code_challenge_method=S256` +
      // 自動認証を無効化し、必ず認証画面（QR・アカウント切替）を表示させる
      // → 別アカウントを追加できるようにするため
      `&disable_auto_auth=1`;

    window.location.href = authUrl;
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-gray-800">
        <a href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Poston" className="w-9 h-9 rounded-xl" />
          <span className="font-bold text-xl tracking-wide">Poston</span>
        </a>
        <a href="/" className="text-sm text-gray-400 hover:text-white transition">
          ← サービス紹介に戻る
        </a>
      </header>

      <section className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="" className="w-16 h-16 rounded-2xl mb-7" />
        <h1 className="text-3xl font-extrabold mb-3">ログイン</h1>
        <p className="text-gray-400 max-w-md mb-9 leading-relaxed">
          TikTokアカウントでログインします。Postonは専用のIDやパスワードを作らず、
          TikTokの認証のみを使用します。
        </p>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-white text-black font-bold px-8 py-4 rounded-full text-lg hover:bg-gray-200 transition disabled:opacity-50"
        >
          {loading ? "移動中..." : "TikTokでログイン"}
        </button>

        <div className="mt-10 max-w-md text-left bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
          <p className="font-bold text-sm">ログイン時に許可をお願いする権限</p>
          <ul className="text-sm text-gray-400 space-y-1.5 leading-relaxed">
            <li>・プロフィール情報（アカウント名・アイコン）の取得</li>
            <li>・フォロワー数などの統計情報の取得</li>
            <li>・投稿済み動画とその再生数などの取得</li>
            <li>・動画の投稿</li>
            <li>・下書きとしての動画送信</li>
          </ul>
          <p className="text-xs text-gray-500 leading-relaxed pt-1">
            許可はTikTokの画面からいつでも解除できます。取得した情報の扱いは
            <a href="/privacy" className="underline hover:text-white">プライバシーポリシー</a>
            をご覧ください。
          </p>
        </div>

        <p className="mt-8 text-sm text-gray-500">
          はじめての方は
          <a href="/help" className="underline hover:text-white mx-1">使い方ガイド</a>
          もご覧ください。
        </p>
      </section>

      <footer className="border-t border-gray-800 text-gray-500 text-sm text-center py-6 px-4">
        <p>
          <a href="/privacy" className="hover:text-white mx-3">プライバシーポリシー</a>
          <a href="/terms" className="hover:text-white mx-3">利用規約</a>
        </p>
        <p className="mt-3">© 2026 Poston — 株式会社CrescenDo</p>
      </footer>
    </main>
  );
}
