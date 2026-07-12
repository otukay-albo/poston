"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { saveToken } from "../lib/tiktokToken";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("処理中...");

  useEffect(() => {
    const code = searchParams.get("code");
    const error = searchParams.get("error");

    if (error) {
      setStatus("ログインがキャンセルされました");
      setTimeout(() => router.push("/"), 2000);
      return;
    }

    if (!code) {
      setStatus("エラーが発生しました");
      setTimeout(() => router.push("/"), 2000);
      return;
    }

    const codeVerifier = sessionStorage.getItem("code_verifier") || "";

    fetch("/api/auth/tiktok", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, code_verifier: codeVerifier }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setStatus("認証に失敗しました: " + data.error);
          setTimeout(() => router.push("/"), 3000);
        } else {
          setStatus("ログイン成功！ダッシュボードに移動します...");
          saveToken(data);
          setTimeout(() => router.push("/dashboard"), 1000);
        }
      })
      .catch(() => {
        setStatus("エラーが発生しました");
        setTimeout(() => router.push("/"), 3000);
      });
  }, [searchParams, router]);

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6">
        <span className="text-black font-extrabold text-4xl">P</span>
      </div>
      <p className="text-gray-300 text-lg">{status}</p>
      <div className="mt-6 w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
    </main>
  );
}

export default function CallbackPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-300">読み込み中...</p>
      </main>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
