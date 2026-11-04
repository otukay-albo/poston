# 自動投稿のセットアップ手順

予約投稿をサーバー側で自動実行するための初期設定。**一度だけ**行う。

---

## 1. Supabase にテーブルを作る

Supabase → 左メニュー **SQL Editor** → **New query** → 以下を貼り付けて **Run**。

```sql
create table scheduled_posts (
  id uuid primary key default gen_random_uuid(),
  open_id text not null,              -- 投稿先のTikTokアカウント
  account_name text,                  -- 表示用の名前
  run_at timestamptz not null,        -- 投稿する時刻（UTCで保存）
  title text default '',              -- キャプション
  privacy_level text default 'SELF_ONLY',
  disable_comment boolean default true,
  disable_duet boolean default true,
  disable_stitch boolean default true,
  brand_content_toggle boolean default false,
  brand_organic_toggle boolean default false,
  video_path text,                    -- Storage上の動画の場所
  video_size bigint,
  status text default '予約',          -- 予約 / 投稿済み / 失敗
  error text,                         -- 失敗した理由
  attempts int default 0,             -- 試行回数
  posted_at timestamptz,
  created_at timestamptz default now()
);

create index scheduled_posts_due on scheduled_posts (status, run_at);
```

※「Run without RLS」で実行してよい（アクセスはサーバー側のチームキーで制限している）。

---

## 2. 動画の保管場所（Storage）を作る

Supabase → 左メニュー **Storage** → **New bucket**

- **Name**: `scheduled-videos`
- **Public bucket**: **オフのまま**（非公開）
- 作成する

---

## 3. 定期実行を設定する（cron-job.org・無料）

Vercelの無料プランは1日1回しか自動実行できないため、外部の無料サービスを使う。

1. https://cron-job.org/ で登録（無料）
2. **Create cronjob** をクリック
3. 設定：

| 項目 | 値 |
|---|---|
| Title | `Poston 予約投稿` |
| URL | `https://poston-app-five.vercel.app/api/run-schedule` |
| Schedule | **Every 5 minutes**（毎時 0,5,10,...分） |

4. **Advanced** → **Headers** を開き、1行追加：

| Key | Value |
|---|---|
| `x-cron-secret` | Vercelの環境変数 `CRON_SECRET` と同じ値 |

5. **Create** で保存

### CRON_SECRET がまだ無い場合

Vercel → poston-app-five → Settings → Environment Variables → **Add**

- Key: `CRON_SECRET`
- Value: 長めのランダムな文字列（例: `openssl rand -hex 24` の出力）
- Type: **Secret**
- Environment: Production

追加後、**Redeploy** する。

---

## 4. 動作確認

1. Postonの投稿画面で「予約する」を選び、**5分後くらい**の時刻で予約する
2. 5分待つ
3. 予約カレンダーで「投稿済み」に変わっていれば成功
4. TikTokアプリで実際に投稿されているか確認

うまくいかないときは、予約カレンダーの該当予約に**失敗理由**が表示される。

---

## 注意：動画のサイズ

無料プランは**サーバーの実行時間が60秒まで**のため、大きい動画は時間切れになる。

- 実測：撮影アプリの動画は **約110MB/分**（1080p）
- 安全に扱えるのは **おおむね60MB以下**（＝30秒程度）

Postonは予約時にサイズを確認し、大きすぎる場合は警告を出す。
1分以上の動画を予約したい場合は、書き出しのビットレートを下げるか、
Vercel Pro（$20/月・実行時間300秒）への変更を検討する。
