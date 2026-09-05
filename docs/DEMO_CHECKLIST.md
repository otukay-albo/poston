# TikTok審査用デモ動画 撮影チェックリスト

最終更新: 2026-09-05
対象: 4回目の再提出（3回目の指摘「Scopes mismatch」への対応）

審査で見られるポイントはひとつ。**申請している5つの権限（スコープ）を、すべて画面上で実際に使っている様子が映っているか。**
1つでも映っていない権限があると「申請内容と実演が一致しない」で落ちる。

---

## 0. 権限と画面の対応表（これを全部映す）

| # | 権限（スコープ） | 何の権限か | 映すべき画面・操作 | 撮影開始からの時刻（記入） |
|---|---|---|---|---|
| 1 | `user.info.basic` | 名前・アイコンの取得 | ログイン直後のダッシュボードに**表示名とアバター**が出る | __:__ |
| 2 | `user.info.stats` | フォロワー数などの取得 | ダッシュボードの**フォロワー・いいね・動画数**の数字 | __:__ |
| 3 | `video.list` | 投稿一覧の取得 | ダッシュボード／アナリティクスの**動画一覧**（再生・いいね・コメント・シェア数） | __:__ |
| 4 | `video.publish` | 動画の直接投稿 | 投稿画面で「**今すぐ投稿**」→ 成功メッセージ → TikTokアプリで動画が存在 | __:__ |
| 5 | `video.upload` | 下書きへの送信 | 投稿画面で「**下書きに送る**」→ 成功メッセージ → TikTokアプリの受信箱に下書き | __:__ |

さらに、ログイン時の**TikTokの同意画面**に5つの権限が並んで表示される場面を必ず映す（審査員が「何を要求しているか」を確認する場面）。

---

## 1. 撮影前の準備（前日〜直前）

### アカウント
- [ ] 撮影に使うTikTokアカウントは **`yukiy375`**（投稿・再生数の実績あり。数字が0だと stats / list を実演できていないと判定されるリスク）
- [ ] TikTokアプリで `yukiy375` を**非公開アカウントに設定**（設定とプライバシー → プライバシー → 非公開アカウント ON）
  ※審査前は非公開アカウントにしか投稿できない仕様
- [ ] スマホのTikTokアプリに `yukiy375` でログインしておく（投稿結果・下書きを見せるため）

### アプリ側
- [ ] Vercelの環境変数がサンドボックス（`NEXT_PUBLIC_TIKTOK_CLIENT_KEY` = `sbaw13956eb823vg88`）になっている
  （確認コマンドは HANDOFF.md 2章、または本書「4. 撮影後」参照）
- [ ] TikTok Developer Portal のサンドボックス設定で、Scopes に上記5つが**すべて**チェックされている
- [ ] Redirect URI がサンドボックス側にも `https://poston-app-five.vercel.app/callback` で登録されている

### 動画素材
- [ ] テスト投稿用の動画を**2本**用意（公開投稿用と下書き用。同じ動画でも可）
- [ ] サイズは **10〜30MB程度、必ず64MB未満**（大容量は分割アップロードが未解決のため失敗する）
- [ ] 内容は差し障りのないもの（審査員が見る）

### リハーサル（本番撮影の直前に1回）
- [ ] 「今すぐ投稿」を**小さい動画で1回成功させる**（公開投稿は未テスト。撮影中に失敗するのを防ぐ）
- [ ] 「下書きに送る」も1回成功させ、スマホの受信箱に下書きが届くまでの時間を把握（数分かかることがある）
- [ ] リハで投稿した動画は、撮影前にTikTokアプリで削除しておくと画面がすっきりする（任意）

### 画面まわり
- [ ] ブラウザは**ログアウト状態**から始める（同意画面を映すため）
- [ ] 他のタブ・通知・個人情報が映らないようにする（ブックマークバー非表示、通知オフ）
- [ ] 画面録画ソフトを準備（macOS: `shift+command+5`）。音声は不要だが、カーソルの動きがゆっくり見えるように
- [ ] スマホの画面も録画できる状態にしておく（TikTokアプリで投稿結果・下書きを見せる）

---

## 2. 撮影の流れ（この順番で、途中で切らずに1本で）

### ① ログイン（同意画面を映す）
1. `https://poston-app-five.vercel.app/` を開く
2. 「TikTokでログイン」を押す
3. **TikTokの同意画面で、要求されている権限の一覧が全部見えるように2〜3秒止める**
4. 承認 → Postonのダッシュボードに戻る

### ② ダッシュボード（basic / stats / list）
5. **表示名とアバター**が出ていることを見せる → `user.info.basic`
6. **フォロワー数・いいね数・動画数**を見せる → `user.info.stats`
7. **動画一覧**（サムネイル＋再生・いいね・コメント・シェア数）をスクロールして見せる → `video.list`
8. サイドバー「アナリティクス」を開き、数値が表示されることも見せる（list の補強）

### ③ 公開投稿（publish）
9. サイドバー「投稿」を開く
10. 動画を選ぶ（64MB未満のもの）
11. キャプションを入力
12. 公開範囲が「自分のみ」になっていることを見せる（審査前はこれしか選べない旨の注記も映る）
13. **インタラクション設定**：初期状態が全部未チェックなのを見せてから「コメントを許可する」だけONにする
14. **商用コンテンツ開示**：トグルをONにし「あなたのブランド」を選ぶ → 表示ラベルが変わるのを見せる
    （※「ブランドコンテンツ」を選ぶと「自分のみ」では投稿できない旨のエラーが出るので、ここでは「あなたのブランド」）
15. 投稿タイミング「**今すぐ投稿**」を選び、投稿ボタンを押す
16. 成功メッセージ「TikTokに動画を投稿しました。処理に数分かかる場合があります。」を映す → `video.publish`

### ④ 下書き送信（upload）
17. 同じ投稿画面で、もう1本の動画を選ぶ
18. 投稿タイミング「**下書きに送る**」を選ぶ（ボタン表記が「TikTokの下書きに送る」に変わるのを見せる）
19. 送信 → 成功メッセージ（TikTokアプリの通知から下書きを開いて…の案内）を映す → `video.upload`

### ⑤ TikTokアプリ側で結果を見せる（スマホ録画）
20. TikTokアプリの**受信箱の通知**から下書きを開き、送った動画が下書きとして存在するのを見せる
21. プロフィールに③で投稿した動画が「自分のみ」で存在するのを見せる
22. （任意）Postonに戻ってサイドバーの「ログアウト」を押して終了

### 撮影後すぐ
- [ ] 録画を見直し、**0章の表に各権限が映った時刻を記入**（提出時の備考に書く）
- [ ] 5つの権限すべてが映っているか、同意画面が映っているかを確認
- [ ] 1本にまとまっていないなら結合する（審査は1本の動画で提出）

---

## 3. 再提出（TikTok Developer Portal）

- [ ] デモ動画をアップロード
- [ ] 備考欄に「どの権限が動画の何分何秒で実演されているか」を書く（下の英文テンプレを使う）
- [ ] Privacy Policy / Terms のURLが本番URLになっているか再確認
- [ ] アプリアイコンがサイトのロゴと同一か再確認（2回目の指摘）

### 備考欄テンプレ（英語）

```
This demo was recorded in the Sandbox environment (sandbox target user: yukiy375),
as instructed in the previous review. All requested scopes are demonstrated:

- 00:00 – Login: TikTok consent screen showing all requested scopes
- __:__ – user.info.basic: display name and avatar shown on the dashboard
- __:__ – user.info.stats: follower / likes / video counts shown on the dashboard
- __:__ – video.list: the user's video list with view / like / comment / share counts
- __:__ – video.publish: direct post via "今すぐ投稿 (Post now)", privacy set to
          Only Me (unaudited client), interaction settings and commercial content
          disclosure shown, "processing may take a few minutes" notice displayed
- __:__ – video.upload: "下書きに送る (Send to drafts)" → draft appears in the
          TikTok app inbox for the user to add music/effects and publish themselves

The app is in Japanese. Button labels: 今すぐ投稿 = Post now, 下書きに送る = Send to drafts,
商用コンテンツ開示 = Commercial content disclosure, 〜を許可する = Allow 〜.
```

---

## 4. 撮影後：環境変数を本番に戻す（忘れると本番がテストユーザー限定のまま）

Vercel → poston-app-five → Settings → Environment Variables

- [ ] `NEXT_PUBLIC_TIKTOK_CLIENT_KEY` → `awnu4vv0a4r9e33s`
- [ ] `TIKTOK_CLIENT_SECRET` → 本番のsecret（Developer Portal の本番 App details で確認）
- [ ] `NEXT_PUBLIC_TIKTOK_SCOPES` が存在していたら削除（コードの既定値で正しい）
- [ ] **Redeploy** を実行
- [ ] 戻ったことを確認（本番サイトのプログラムに含まれるキーを見る）：

```bash
cd /tmp && curl -sL https://poston-app-five.vercel.app/ -o index.html && grep -o '/_next/static/[^"]*\.js' index.html | sort -u | while read p; do curl -sL "https://poston-app-five.vercel.app$p" | grep -o 'sbaw[a-z0-9]*\|awnu4vv0a4r9e33s'; done | sort -u
```

`awnu4vv0a4r9e33s` だけが表示されればOK。`sbaw…` が出たらまだサンドボックス。

---

## 5. よくある落ちる原因（最終確認）

- [ ] 権限が1つでも映っていない（特に `video.upload` と `user.info.stats`）
- [ ] 数字が全部0の状態で撮っている（`yukiy375` 以外のアカウントを使った）
- [ ] 同意画面を飛ばしている（ログイン済みの状態で撮り始めた）
- [ ] 投稿が失敗している場面が映っている（→リハをせずに撮った）
- [ ] 本番環境で撮っている（3回目の指摘は「サンドボックスで実演せよ」）
