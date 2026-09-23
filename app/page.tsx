import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Poston｜TikTok複数アカウント運用ツール",
  description:
    "Postonは、企業のTikTok運用チーム向けに、複数アカウントの投稿・予約・分析をひとつの画面にまとめるツールです。運営：株式会社CrescenDo。",
};

const 機能 = [
  {
    icon: "📝",
    title: "動画の投稿",
    lead: "TikTokに直接投稿",
    body: "パソコンから動画を選び、キャプション・公開範囲・コメントやデュエットの可否を設定して投稿できます。公開範囲は毎回ご自身で選ぶ方式で、初期値は設定していません。",
  },
  {
    icon: "📥",
    title: "下書きとして送る",
    lead: "アプリで仕上げてから投稿",
    body: "「下書きに送る」を選ぶと、動画がTikTokアプリの受信箱に届きます。アプリ内の音楽やエフェクトを足してから、ご自身のタイミングで投稿できます。",
  },
  {
    icon: "📅",
    title: "投稿カレンダー",
    lead: "ロサンゼルス時間で管理",
    body: "予定をカレンダーとリストの2つの見方で確認できます。海外向けの運用に合わせ、日時はロサンゼルス時間を基準に表示します。",
  },
  {
    icon: "📊",
    title: "アナリティクス",
    lead: "投稿後の数字を追う",
    body: "再生数・いいね・コメント・シェアと、そこから計算した各種比率を表示します。期間を絞ったり、月別・週別・日別に集計したりできます。",
  },
  {
    icon: "🔍",
    title: "傾向分析",
    lead: "伸びる条件を探す",
    body: "ハッシュタグ別の成績や、投稿した時間帯ごとの成績を中央値で比較できます。少数の大当たりに引っ張られない見方で判断できます。",
  },
  {
    icon: "👥",
    title: "複数アカウント管理",
    lead: "チームで共有",
    body: "複数のTikTokアカウントを画面左から切り替えられます。チーム共有を有効にすると、別のパソコンからも同じアカウントを扱えます。",
  },
];

const 手順 = [
  {
    n: "1",
    title: "TikTokでログイン",
    body: "Poston専用のIDやパスワードは作りません。TikTokの認証画面で、必要な権限を確認して許可してください。",
  },
  {
    n: "2",
    title: "アカウントを追加",
    body: "運用しているアカウントを続けて追加できます。追加したアカウントは画面左から切り替えられます。",
  },
  {
    n: "3",
    title: "投稿して、数字を見る",
    body: "投稿または予約を登録し、しばらく経ってからアナリティクスで結果を確認します。データは自動で取得・蓄積されます。",
  },
];

const よくある質問 = [
  {
    q: "Postonを使うのに、専用のアカウント登録は必要ですか？",
    a: "不要です。TikTokアカウントでのログインだけで利用できます。Postonがパスワードを受け取ることはありません。",
  },
  {
    q: "保存数や平均視聴時間は見られますか？",
    a: "見られません。これらはTikTokが外部ツール向けに提供していない数値のため、Postonに限らず取得できません。TikTokアプリ内の分析画面でご確認ください。",
  },
  {
    q: "写真（画像）の投稿はできますか？",
    a: "現在は動画のみに対応しています。写真投稿の分析数値もTikTokから提供されていないため、表示できません。",
  },
  {
    q: "取得したデータは誰が見られますか？",
    a: "ログインしたご本人と、チーム共有を有効にした同じチームのメンバーのみです。第三者に販売・提供することはありません。",
  },
  {
    q: "連携をやめたいときは？",
    a: "Poston側でログアウトするか、TikTokアプリの「設定とプライバシー → セキュリティとアクセス許可 → アプリの管理」から連携を解除してください。",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 bg-black/90 backdrop-blur border-b border-gray-800">
        <div className="max-w-5xl mx-auto flex items-center gap-4 px-6 py-4">
          <a href="/" className="flex items-center gap-3 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Poston" className="w-9 h-9 rounded-xl" />
            <span className="font-bold text-xl tracking-wide">Poston</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 ml-4 text-sm text-gray-400">
            <a href="#features" className="hover:text-white transition">機能</a>
            <a href="#how" className="hover:text-white transition">使い方</a>
            <a href="#data" className="hover:text-white transition">扱うデータ</a>
            <a href="#faq" className="hover:text-white transition">よくある質問</a>
            <a href="#company" className="hover:text-white transition">運営会社</a>
          </nav>
          <a
            href="/login"
            className="ml-auto bg-white text-black font-bold text-sm px-5 py-2.5 rounded-full hover:bg-gray-200 transition shrink-0"
          >
            ログイン
          </a>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="max-w-5xl mx-auto px-6 pt-20 pb-16 text-center">
        <p className="text-sm text-gray-500 mb-5 tracking-wide">TikTok運用チームのための管理ツール</p>
        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-6">
          複数のTikTokアカウントを、
          <br className="hidden md:block" />
          ひとつの画面で運用する。
        </h1>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          投稿・予約・分析をまとめて管理できます。アカウントごとにアプリを開き直したり、
          数字を手作業で書き写したりする必要はありません。
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href="/login"
            className="bg-white text-black font-bold px-8 py-4 rounded-full text-lg hover:bg-gray-200 transition"
          >
            TikTokでログイン
          </a>
          <a
            href="/help"
            className="border border-gray-700 px-8 py-4 rounded-full text-lg hover:border-gray-400 transition"
          >
            使い方を見る
          </a>
        </div>
        <p className="text-xs text-gray-600 mt-6">
          専用のIDやパスワードは不要です。TikTokの認証のみを使用します。
        </p>
      </section>

      {/* 機能 */}
      <section id="features" className="border-t border-gray-800 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-3">できること</h2>
          <p className="text-gray-400 mb-12 leading-relaxed">
            日々の運用で使う機能をひととおり備えています。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {機能.map((f) => (
              <div key={f.title} className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-bold text-lg mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 mb-3">{f.lead}</p>
                <p className="text-gray-400 text-sm leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 使い方 */}
      <section id="how" className="border-t border-gray-800 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-3">使いはじめる</h2>
          <p className="text-gray-400 mb-12 leading-relaxed">3ステップで始められます。</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {手順.map((s) => (
              <div key={s.n} className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
                <div className="w-9 h-9 rounded-full bg-white text-black font-bold flex items-center justify-center mb-5">
                  {s.n}
                </div>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 扱うデータ */}
      <section id="data" className="border-t border-gray-800 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-3">扱うデータ</h2>
          <p className="text-gray-400 mb-12 leading-relaxed">
            何を取得し、何を取得しないかを明記しています。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
              <h3 className="font-bold mb-4 text-green-400">取得するもの</h3>
              <ul className="text-gray-400 text-sm space-y-2.5 leading-relaxed">
                <li>・アカウント名とアイコン（どのアカウントを操作中か表示するため）</li>
                <li>・フォロワー数・いいね数・動画本数</li>
                <li>・投稿済み動画の再生数・いいね・コメント・シェア数</li>
                <li>・動画の長さと投稿日時</li>
              </ul>
            </div>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
              <h3 className="font-bold mb-4 text-gray-400">取得しないもの</h3>
              <ul className="text-gray-400 text-sm space-y-2.5 leading-relaxed">
                <li>・TikTokのパスワード（Postonが受け取ることはありません）</li>
                <li>・ダイレクトメッセージの内容</li>
                <li>・フォロワー個人の情報</li>
                <li>・保存数、平均視聴時間、視聴者の属性（TikTokが提供していないため取得できません）</li>
              </ul>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-6 leading-relaxed">
            取得した情報の保存期間や削除方法は
            <a href="/privacy" className="underline hover:text-white mx-1">プライバシーポリシー</a>
            に記載しています。
          </p>
        </div>
      </section>

      {/* よくある質問 */}
      <section id="faq" className="border-t border-gray-800 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-12">よくある質問</h2>
          <div className="space-y-5">
            {よくある質問.map((f) => (
              <div key={f.q} className="bg-gray-900 border border-gray-800 rounded-2xl p-7">
                <h3 className="font-bold mb-2.5">{f.q}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 英語での概要（審査担当者・海外メンバー向け） */}
      <section className="border-t border-gray-800 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-6">About Poston (English)</h2>
          <div className="text-gray-400 text-sm leading-relaxed space-y-4">
            <p>
              Poston is a web tool for marketing teams that manage several TikTok accounts.
              From a single dashboard, a team can publish a video to TikTok, send a video to the
              creator&apos;s TikTok drafts to finish editing in the app, plan posts on a calendar in
              Los Angeles time, and review performance across accounts.
            </p>
            <p>
              Sign-in uses TikTok Login only — Poston never creates or receives a password. With the
              user&apos;s permission we read the account name and avatar, follower and video counts,
              and the view / like / comment / share counts of their own posts, and we use the Content
              Posting API to publish a video or upload it as a draft. Metrics that TikTok does not
              expose to third-party tools — saves, average watch time and audience demographics —
              are not available in Poston, and we say so plainly rather than estimating them.
            </p>
            <p>
              Poston is operated by CrescenDo Inc. (株式会社CrescenDo), Japan. See the{" "}
              <a href="/privacy" className="underline hover:text-white">Privacy Policy</a> and{" "}
              <a href="/terms" className="underline hover:text-white">Terms of Service</a> for how
              data is stored and deleted, or contact us at{" "}
              <a href="mailto:otuka.y@al-bo.io" className="underline hover:text-white">otuka.y@al-bo.io</a>.
            </p>
          </div>
        </div>
      </section>

      {/* 運営会社 */}
      <section id="company" className="border-t border-gray-800 py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10">運営会社</h2>
          <dl className="divide-y divide-gray-800 border-y border-gray-800">
            {[
              ["サービス名", "Poston"],
              ["運営会社", "株式会社CrescenDo（CrescenDo Inc.）"],
              ["所在地", "日本"],
              ["提供内容", "TikTokアカウント運用管理ツールの開発・提供"],
            ].map(([k, v]) => (
              <div key={k} className="grid grid-cols-3 gap-4 py-4 text-sm">
                <dt className="text-gray-500">{k}</dt>
                <dd className="col-span-2">{v}</dd>
              </div>
            ))}
            <div className="grid grid-cols-3 gap-4 py-4 text-sm">
              <dt className="text-gray-500">会社サイト</dt>
              <dd className="col-span-2">
                <a
                  href="https://cresc-buzz.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-gray-300"
                >
                  https://cresc-buzz.com/
                </a>
              </dd>
            </div>
            <div className="grid grid-cols-3 gap-4 py-4 text-sm">
              <dt className="text-gray-500">お問い合わせ</dt>
              <dd className="col-span-2">
                <a href="mailto:otuka.y@al-bo.io" className="underline hover:text-gray-300">
                  otuka.y@al-bo.io
                </a>
                <span className="block text-gray-500 text-xs mt-1">
                  ご利用に関するご質問・データ削除のご依頼はこちらへご連絡ください。
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-800 py-12">
        <div className="max-w-5xl mx-auto px-6 flex flex-col md:flex-row gap-8 justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="" className="w-8 h-8 rounded-lg" />
              <span className="font-bold">Poston</span>
            </div>
            <p className="text-gray-500 text-sm">TikTok運用チームのための管理ツール</p>
          </div>
          <div className="flex gap-12 text-sm">
            <div>
              <p className="text-gray-500 mb-3">サービス</p>
              <ul className="space-y-2">
                <li><a href="#features" className="text-gray-400 hover:text-white transition">機能</a></li>
                <li><a href="/help" className="text-gray-400 hover:text-white transition">使い方ガイド</a></li>
                <li><a href="/login" className="text-gray-400 hover:text-white transition">ログイン</a></li>
              </ul>
            </div>
            <div>
              <p className="text-gray-500 mb-3">規約・会社</p>
              <ul className="space-y-2">
                <li><a href="/privacy" className="text-gray-400 hover:text-white transition">プライバシーポリシー</a></li>
                <li><a href="/terms" className="text-gray-400 hover:text-white transition">利用規約</a></li>
                <li><a href="#company" className="text-gray-400 hover:text-white transition">運営会社</a></li>
              </ul>
            </div>
          </div>
        </div>
        <p className="text-gray-600 text-sm text-center mt-10">
          © 2026 Poston — 株式会社CrescenDo
        </p>
      </footer>
    </main>
  );
}
