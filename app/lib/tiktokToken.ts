// TikTokトークンの保存・取得・自動更新＋複数アカウント管理をまとめたヘルパー。
// - アクティブアカウントのトークンは "tiktok_token" に保存（後方互換）
// - ログイン済み全アカウントは "tiktok_accounts" に配列で保存
// - アクセストークンは約24時間で切れるため、失効間近で自動リフレッシュする

const ACTIVE_KEY = "tiktok_token";
const ACCOUNTS_KEY = "tiktok_accounts";
const TEAM_KEY = "poston_team_key";

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
  void pushAccountToServer(record); // チーム同期が有効なら共有DBにも保存
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
  deleteAccountFromServer(open_id); // チーム同期が有効なら共有DBからも削除
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
  const updated = readAccounts().find((a) => a.open_id === open_id);
  if (updated) void pushAccountToServer(updated);
}

// アカウントに「分析データ名」を紐づける（分析ページで使用）
export function setAccountAnalyticsName(open_id: string, analytics_name: string): void {
  const active = getStoredToken();
  if (active && active.open_id === open_id) {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify({ ...active, analytics_name }));
  }
  writeAccounts(readAccounts().map((a) => (a.open_id === open_id ? { ...a, analytics_name } : a)));
  const updated = readAccounts().find((a) => a.open_id === open_id);
  if (updated) void pushAccountToServer(updated);
}

// 全アカウントを削除（完全ログアウト）
export function clearToken(): void {
  localStorage.removeItem(ACTIVE_KEY);
  localStorage.removeItem(ACCOUNTS_KEY);
}

// 有効なアクセストークンを返す。期限切れ間近なら自動でリフレッシュする。
// 更新に失敗した場合や、トークンが無い場合は null を返す（呼び出し側で再ログインへ誘導）。
export async function getValidAccessToken(): Promise<{ access_token: string; open_id: string } | null> {
  let token = getStoredToken();
  if (!token || !token.access_token) return null;

  const BUFFER_MS = 5 * 60 * 1000; // 失効5分前には更新する
  const stillValid = typeof token.expires_at === "number" && Date.now() < token.expires_at - BUFFER_MS;
  if (stillValid) {
    return { access_token: token.access_token, open_id: token.open_id };
  }

  // チーム同期が有効なら、他の端末が更新した最新トークンが共有DBにある可能性が
  // あるため、リフレッシュ前に確認する（トークンの二重更新による失効を防ぐ）
  const serverLatest = await fetchServerAccount(token.open_id);
  if (serverLatest && (serverLatest.expires_at || 0) > (token.expires_at || 0)) {
    const merged = { ...token, ...serverLatest };
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(merged));
    writeAccounts(readAccounts().map((a) => (a.open_id === merged.open_id ? merged : a)));
    token = merged;
    const nowValid = typeof token.expires_at === "number" && Date.now() < token.expires_at - BUFFER_MS;
    if (nowValid) {
      return { access_token: token.access_token, open_id: token.open_id };
    }
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

// ===== チーム同期（アカウントのサーバー共有）=====
// 環境変数 POSTON_TEAM_KEY と同じ「チームキー」を各メンバーが一度入力すると、
// 接続済みアカウントが共有DB(Supabase)に保存され、どのブラウザ/PCからでも使える。

export function getTeamKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TEAM_KEY);
}

export function setTeamKey(key: string): void {
  localStorage.setItem(TEAM_KEY, key);
}

export function clearTeamKey(): void {
  localStorage.removeItem(TEAM_KEY);
}

type ServerAccount = {
  open_id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  analytics_name?: string | null;
  access_token: string;
  refresh_token?: string | null;
  expires_at?: number | null;
};

function fromServer(r: ServerAccount): StoredToken {
  return {
    open_id: r.open_id,
    access_token: r.access_token,
    refresh_token: r.refresh_token || undefined,
    expires_at: r.expires_at || undefined,
    display_name: r.display_name || undefined,
    avatar_url: r.avatar_url || undefined,
    analytics_name: r.analytics_name || undefined,
  };
}

// サーバーの全アカウントを取得してローカルにマージする（新しいトークンを優先）
export async function syncAccountsFromServer(): Promise<{ ok: boolean; count?: number; error?: string }> {
  const key = getTeamKey();
  if (!key) return { ok: false, error: "チームキーが未設定です" };
  try {
    const res = await fetch("/api/accounts", { headers: { "x-team-key": key } });
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` };

    const serverList: StoredToken[] = (data.accounts || []).map(fromServer);
    const local = readAccounts();
    const map = new Map(local.map((a) => [a.open_id, a]));
    serverList.forEach((s) => {
      const l = map.get(s.open_id);
      if (!l || (s.expires_at || 0) >= (l.expires_at || 0)) map.set(s.open_id, { ...l, ...s });
    });
    const merged = Array.from(map.values());
    writeAccounts(merged);

    // ローカルにしか無いアカウントはサーバーへ登録
    local.forEach((l) => {
      if (!serverList.find((s) => s.open_id === l.open_id)) void pushAccountToServer(l);
    });

    // アクティブアカウントも最新化（無ければ先頭を設定）
    const active = getStoredToken();
    if (active) {
      const updated = merged.find((a) => a.open_id === active.open_id);
      if (updated) localStorage.setItem(ACTIVE_KEY, JSON.stringify(updated));
    } else if (merged.length > 0) {
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(merged[0]));
    }
    return { ok: true, count: merged.length };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function pushAccountToServer(t: StoredToken): Promise<void> {
  const key = getTeamKey();
  if (!key) return;
  try {
    await fetch("/api/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-team-key": key },
      body: JSON.stringify(t),
    });
  } catch {
    // 同期失敗してもローカル動作は継続
  }
}

export function deleteAccountFromServer(open_id: string): void {
  const key = getTeamKey();
  if (!key) return;
  void fetch("/api/accounts", {
    method: "DELETE",
    headers: { "Content-Type": "application/json", "x-team-key": key },
    body: JSON.stringify({ open_id }),
  }).catch(() => {});
}

async function fetchServerAccount(open_id: string): Promise<StoredToken | null> {
  const key = getTeamKey();
  if (!key) return null;
  try {
    const res = await fetch("/api/accounts", { headers: { "x-team-key": key } });
    if (!res.ok) return null;
    const data = await res.json();
    const found = (data.accounts || []).find((a: ServerAccount) => a.open_id === open_id);
    return found ? fromServer(found) : null;
  } catch {
    return null;
  }
}
