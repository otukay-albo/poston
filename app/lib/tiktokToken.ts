// TikTokトークンの保存・取得・自動更新をまとめたヘルパー。
// アクセストークンは約24時間で切れるため、期限が近づいたら
// リフレッシュトークンで裏側で自動更新し、再ログインを不要にする。

const STORAGE_KEY = "tiktok_token";

export interface StoredToken {
  access_token: string;
  refresh_token?: string;
  open_id: string;
  scope?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  expires_at?: number; // アクセストークンの失効時刻（ミリ秒）
}

// APIレスポンスを受け取り、失効時刻を計算して保存する
export function saveToken(data: Partial<StoredToken>): void {
  const expires_at =
    typeof data.expires_in === "number" ? Date.now() + data.expires_in * 1000 : undefined;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, expires_at }));
}

export function getStoredToken(): StoredToken | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
}

export function clearToken(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// 有効なアクセストークンを返す。期限切れ間近なら自動でリフレッシュする。
// 更新に失敗した場合や、トークンが無い場合は null を返す（呼び出し側で再ログインへ誘導）。
export async function getValidAccessToken(): Promise<{ access_token: string; open_id: string } | null> {
  const token = getStoredToken();
  if (!token || !token.access_token) return null;

  const BUFFER_MS = 5 * 60 * 1000; // 失効5分前には更新する
  const stillValid = typeof token.expires_at === "number" && Date.now() < token.expires_at - BUFFER_MS;
  if (stillValid) {
    return { access_token: token.access_token, open_id: token.open_id };
  }

  // 失効時刻が不明（旧トークン）で refresh_token も無い場合は、
  // ひとまず既存のアクセストークンをそのまま返す（失敗時は呼び出し側で再ログイン）
  if (!token.refresh_token) {
    return { access_token: token.access_token, open_id: token.open_id };
  }

  try {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: token.refresh_token }),
    });
    const data = await res.json();
    if (data.error || !data.access_token) {
      return null;
    }
    // 新しいトークン（refresh_tokenも更新される）を保存
    saveToken({ ...token, ...data });
    return { access_token: data.access_token, open_id: data.open_id || token.open_id };
  } catch {
    return null;
  }
}
