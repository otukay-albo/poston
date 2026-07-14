// TikTokトークンの保存・取得・自動更新＋複数アカウント管理をまとめたヘルパー。
// - アクティブアカウントのトークンは "tiktok_token" に保存（後方互換）
// - ログイン済み全アカウントは "tiktok_accounts" に配列で保存
// - アクセストークンは約24時間で切れるため、失効間近で自動リフレッシュする

const ACTIVE_KEY = "tiktok_token";
const ACCOUNTS_KEY = "tiktok_accounts";

export interface StoredToken {
  access_token: string;
  refresh_token?: string;
  open_id: string;
  scope?: string;
  expires_in?: number;
  refresh_expires_in?: number;
  expires_at?: number; // アクセストークンの失効時刻（ミリ秒）
  display_name?: string; // アカウント切替の表示用
  avatar_url?: string; // アカウント切替の表示用
  analytics_name?: string; // 分析データ(Supabase)のアカウント名。TikTok名と異なるため個別に紐づける
}

function readAccounts(): StoredToken[] {
  const raw = localStorage.getItem(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw);
    return Array.isArray(list) ? (list as StoredToken[]) : [];
  } catch {
    return [];
  }
}

function writeAccounts(list: StoredToken[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

export function getStoredToken(): StoredToken | null {
  const raw = localStorage.getItem(ACTIVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredToken;
  } catch {
    return null;
  }
}

// APIレスポンスを受け取り、失効時刻を計算して保存し、アクティブに設定する。
// 同じopen_idの既存アカウントがあれば表示情報を引き継いで更新する。
export function saveToken(data: Partial<StoredToken>): void {
  const expires_at =
    typeof data.expires_in === "number" ? Date.now() + data.expires_in * 1000 : undefined;
  const existing =
    readAccounts().find((a) => a.open_id === data.open_id) ||
    (getStoredToken()?.open_id === data.open_id ? getStoredToken() : null);
  const record: StoredToken = {
    ...(existing || {}),
    ...data,
    expires_at,
  } as StoredToken;

  localStorage.setItem(ACTIVE_KEY, JSON.stringify(record));
  const list = readAccounts().filter((a) => a.open_id !== record.open_id);
  list.push(record);
  writeAccounts(list);
}

export function listAccounts(): StoredToken[] {
  return readAccounts();
}

// アカウントを切り替える（成功時true）
export function switchAccount(open_id: string): boolean {
  const target = readAccounts().find((a) => a.open_id === open_id);
  if (!target) return false;
  localStorage.setItem(ACTIVE_KEY, JSON.stringify(target));
  return true;
}

// アカウントを削除する。削除したのがアクティブなら、残りの先頭に切り替える。
export function removeAccount(open_id: string): void {
  const list = readAccounts().filter((a) => a.open_id !== open_id);
  writeAccounts(list);
  const active = getStoredToken();
  if (active && active.open_id === open_id) {
    if (list.length > 0) {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(list[0]));
    } else {
      localStorage.removeItem(ACTIVE_KEY);
    }
  }
}

// アクティブアカウントだけログアウトし、残りがあれば切り替える。残りの数を返す。
export function logoutActiveAccount(): number {
  const active = getStoredToken();
  if (active) removeAccount(active.open_id);
  return readAccounts().length;
}

// アカウントの表示名/アイコンを保存（切替UIの表示用）
export function setAccountProfile(open_id: string, display_name?: string, avatar_url?: string): void {
  const merge = (t: StoredToken): StoredToken => ({
    ...t,
    display_name: display_name ?? t.display_name,
    avatar_url: avatar_url ?? t.avatar_url,
  });
  const active = getStoredToken();
  if (active && active.open_id === open_id) {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(merge(active)));
  }
  writeAccounts(readAccounts().map((a) => (a.open_id === open_id ? merge(a) : a)));
}

// アカウントに「分析データ名」を紐づける（分析ページで使用）
export function setAccountAnalyticsName(open_id: string, analytics_name: string): void {
  const active = getStoredToken();
  if (active && active.open_id === open_id) {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify({ ...active, analytics_name }));
  }
  writeAccounts(readAccounts().map((a) => (a.open_id === open_id ? { ...a, analytics_name } : a)));
}

// 全アカウントを削除（完全ログアウト）
export function clearToken(): void {
  localStorage.removeItem(ACTIVE_KEY);
  localStorage.removeItem(ACCOUNTS_KEY);
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
