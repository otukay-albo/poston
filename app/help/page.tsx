import AppShell from "../components/AppShell";

const 機能一覧 = [
  {
    icon: "📊",
    title: "数値を分析する",
    desc: "再生数・いいね・コメント・共有・エンゲージ率を自動で集計。期間を切り替えて推移を確認したり、CSVで書き出してレポートに活用できます。",
  },
  {
    icon: "🎬",
    title: "投稿・予約する",
    desc: "動画とキャプションを設定して、TikTokへ直接投稿。「予約する」を選べば、指定日時（ロサンゼルス時間）の予約としてカレンダーに登録できます。",
  },
  {
    icon: "👥",
    title: "複数アカウントを管理",
    desc: "複数のTikTokアカウントを接続し、サイドバーで切り替えながら投稿・分析。事業部ごとの運用を1つの画面に集約できます。",
  },
];

const 手順 = [
  {
    title: "TikTokアカウントを連携する",
    desc: "サイドバー下部の「＋アカウントを追加」からTikTokでログインします。複数アカウントを追加でき、追加後はワンクリックで切り替えられます。別のアカウントを追加するときは、認証画面のQRコードを、そのアカウントでログイン中のスマホTikTokアプリで読み取るのが確実です。",
  },
  {
    title: "投稿・予約する",
    desc: "「投稿」ページで動画を選び、キャプション・公開範囲を設定します。「今すぐ投稿」でそのままTikTokへ、「予約する」で日時（LA時間）を指定して予約カレンダーに登録します。予約は「予約カレンダー」ページでカレンダー／リスト表示で確認・編集できます。",
  },
  {
    title: "結果を分析・改善する",
    desc: "「アナリティクス」で数値と推移を確認します。初回のみ、アカウントに「分析データ名」（集計データ上のアカウント名）を設定してください。「傾向分析」では、伸びるハッシュタグや投稿時間帯の傾向を確認できます。",
  },
];

const FAQ = [
  {
    q: "公開投稿ができない・「自分のみ」しか選べない",
    a: "現在TikTokの審査中のため、投稿は非公開（自分のみ）に制限されています。また投稿するアカウント自体を「非公開アカウント」に設定しておく必要があります。審査承認後に公開投稿が解禁されます。",
  },
  {
    q: "予約した投稿は自動で投稿される？",
    a: "自動投稿はTikTok審査の承認後に有効になります。現在の予約は「計画の登録・可視化」までで、動画ファイルは保存されません。承認後に、予約時刻に自動投稿される仕組みが有効化されます。",
  },
  {
    q: "時刻はどこの時間？",
    a: "投稿・予約まわりの時刻はすべてロサンゼルス時間（LA）基準です。投稿ページと予約カレンダーにLAの現在時刻が表示されています。",
  },
  {
    q: "「分析データ名」とは？",
    a: "分析データ（集計スプレッドシート）上のアカウント名です。TikTokの表示名と異なるため、アナリティクス・傾向分析で初回のみ紐づけが必要です。一度設定すれば以降は自動で使われます。",
  },
  {
    q: "アカウントを追加しようとすると同じアカウントでログインされてしまう",
    a: "ブラウザのTikTokログイン状態が使い回されるためです。認証画面のQRコードを、追加したいアカウントでログイン中のスマホTikTokアプリで読み取ってください。（シークレットウィンドウでの追加は保存されないため使わないでください）",
  },
  {
    q: "平均視聴時間・保存数・視聴者の年代/性別は見られない？",
    a: "TikTok公式APIがこれらのデータを提供していないため、自動取得はできません。TikTok Studio（アプリ内分析）で確認するか、StudioのCSVをPostonへ取り込む機能（準備中）で対応予定です。",
  },
];

export default function HelpPage() {
  return (
    <AppShell current="help" title="ヘルプ / 使い方">
      <div className="flex-1 px-6 md:px-10 py-8 max-w-4xl mx-auto w-full">
        {/* 概要 */}
        <section className="mb-10">
          <h1 className="text-2xl font-bold mb-3">Postonとは</h1>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
            Postonは、複数のTikTokアカウントの<strong>「分析」と「投稿・予約」</strong>を1か所でまとめて行える社内向けツールです。
            アカウントを連携するだけで、数値の確認から動画の投稿・投稿計画の管理までをこの画面で完結できます。
          </p>
        </section>

        {/* できること */}
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">Postonでできること</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {機能一覧.map((f) => (
              <div key={f.title} className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5">
                <p className="text-2xl mb-3">{f.icon}</p>
                <h3 className="font-bold text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* はじめかた */}
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">はじめかた（3ステップ）</h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl px-6 py-2 divide-y divide-gray-200 dark:divide-gray-800">
            {手順.map((s, i) => (
              <div key={s.title} className="flex gap-4 py-5">
                <div className="w-7 h-7 rounded-full bg-black dark:bg-white text-white dark:text-black text-sm font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-bold text-sm mb-1">{s.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* よくある質問 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">よくある質問・注意事項</h2>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="bg-gray-50 dark:bg-gray-900 rounded-xl px-5 py-4 group">
                <summary className="text-sm font-semibold cursor-pointer list-none flex items-center justify-between gap-3">
                  <span>{f.q}</span>
                  <span className="text-gray-400 group-open:rotate-90 transition-transform shrink-0">›</span>
                </summary>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-3">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* 問い合わせ */}
        <section className="mb-6">
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 text-sm">
            <p className="font-bold mb-1">お問い合わせ</p>
            <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
              不明点・不具合は開発担当まで：{" "}
              <a href="mailto:otuka.y@al-bo.io" className="underline hover:text-black dark:hover:text-white">otuka.y@al-bo.io</a>
              <br />
              運営：株式会社CrescenDo（
              <a href="https://cresc-buzz.com/" target="_blank" rel="noreferrer" className="underline hover:text-black dark:hover:text-white">cresc-buzz.com</a>
              ）・
              <a href="/terms" className="underline hover:text-black dark:hover:text-white">利用規約</a>・
              <a href="/privacy" className="underline hover:text-black dark:hover:text-white">プライバシーポリシー</a>
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
