import AppShell from "../components/AppShell";

const 機能一覧 = [
  {
    icon: "🎬",
    title: "TikTokに投稿する",
    desc: "動画とキャプション、公開範囲を設定して、パソコンからそのまま投稿できます。",
  },
  {
    icon: "⏰",
    title: "予約して自動で投稿する",
    desc: "日時（ロサンゼルス時間）を指定しておくと、その時刻に自動で投稿されます。パソコンを閉じていても実行されます。",
  },
  {
    icon: "📥",
    title: "下書きに送る",
    desc: "動画をTikTokアプリの下書きに届けます。アプリで音楽やエフェクトを足してから、自分で投稿できます。",
  },
  {
    icon: "📊",
    title: "数値を確認する",
    desc: "再生数・いいね・コメント・シェアと各種の比率を表示。期間で絞り込んだり、月・週・日ごとに集計したり、CSVで書き出せます。",
  },
  {
    icon: "🔍",
    title: "傾向をつかむ",
    desc: "ハッシュタグ別・投稿時間帯別の成績を比べて、伸びやすい条件を探せます。",
  },
  {
    icon: "👥",
    title: "複数アカウントをチームで使う",
    desc: "複数のTikTokアカウントを切り替えて運用できます。チーム同期を設定すると、別のパソコンからも同じアカウントと予約を扱えます。",
  },
];

const 手順 = [
  {
    title: "TikTokアカウントを連携する",
    desc: "サイドバー下部の「＋ アカウントを追加」からTikTokでログインします。続けて複数のアカウントを追加でき、追加後はサイドバーでワンクリックで切り替えられます。",
  },
  {
    title: "チーム同期を設定する",
    desc: "サイドバー左下の「🔗 チーム同期を設定」を押し、管理者から共有されたチームキー（合言葉）を入力します。予約投稿と、数値の「更新」にはこの設定が必要です。一度設定すれば、そのブラウザでは以降ずっと有効です。",
  },
  {
    title: "投稿する・予約する",
    desc: "「投稿」ページで動画を選び、キャプションと公開範囲を設定します。投稿タイミングは「今すぐ投稿」「予約する」「下書きに送る」の3つから選べます（違いは下の表をご覧ください）。",
  },
  {
    title: "結果を確認する",
    desc: "「アナリティクス」で数値を確認します。上部のタブで「概要」「集計」「傾向分析」を切り替えられます。最新の数値にしたいときは、右上の「🔄 更新」を押してください。",
  },
];

const 投稿方法 = [
  {
    name: "今すぐ投稿",
    when: "すぐに公開したいとき",
    how: "ボタンを押すと、その場でTikTokに投稿されます。",
  },
  {
    name: "予約する",
    when: "決まった時刻に出したいとき",
    how: "指定した日時（LA時間）に自動で投稿されます。動画はPostonに一時保存され、投稿後に削除されます。",
  },
  {
    name: "下書きに送る",
    when: "TikTokアプリの音楽やエフェクトを使いたいとき",
    how: "TikTokアプリの受信箱に下書きが届きます。公開はされません。アプリで仕上げて、自分で投稿します。",
  },
];

const カレンダー凡例 = [
  { mark: "⏰", name: "予約", desc: "時刻になると自動で投稿されます。クリックすると内容の確認と取り消しができます。" },
  { mark: "✓", name: "投稿済み", desc: "自動投稿が完了したものです（薄い色で表示）。" },
  { mark: "⚠", name: "失敗", desc: "投稿できなかったものです（赤枠）。クリックすると理由が表示されます。" },
  { mark: "┄", name: "メモ（破線）", desc: "投稿計画の書き留めです。自動投稿はされません。「＋ メモ」または日付のクリックで追加できます。" },
];

const FAQ = [
  {
    q: "予約した投稿は、本当に自動で投稿される？",
    a: "はい。予約時刻になると自動でTikTokに投稿されます。ブラウザやパソコンを閉じていても実行されます。確認は5分おきに行われるため、予約時刻から最大で5分ほど遅れることがあります。結果は「投稿」→「予約カレンダー」で確認できます。",
  },
  {
    q: "予約を変更・取り消したい",
    a: "「投稿」→「予約カレンダー」で該当の予約をクリックし、「予約を取り消す」を押してください。日時やキャプションの変更は現在できないため、いったん取り消してから予約し直してください。",
  },
  {
    q: "予約が「失敗」になった",
    a: "予約カレンダーで⚠の予約をクリックすると、失敗の理由が表示されます。自動で3回まで再試行し、それでも投稿できなかった場合に「失敗」となります。多い原因は、動画のサイズが大きすぎること（下の項目を参照）と、アカウントのログイン期限切れ（再ログインで解消）です。",
  },
  {
    q: "動画のサイズや長さに制限はある？",
    a: "予約投稿は60MB以下が目安です（撮影したままの高画質な動画だと30秒ほど）。これを超える動画を選ぶと、予約画面に注意が表示されます。また「今すぐ投稿」でも、64MBを超える動画はうまく投稿できない場合があります。動画の書き出し設定で画質（ビットレート）を下げると、見た目をほぼ変えずにサイズを小さくできます。対応形式はMP4とMOVです。",
  },
  {
    q: "同じ時刻に複数の予約を入れるとどうなる？",
    a: "アカウントが同じでも別でも、順番に投稿されます。動画が小さければ同じ回でまとめて投稿されますが、時間がかかる場合は残りが次の回（5分後）になります。",
  },
  {
    q: "公開範囲で「自分のみ」しか選べない",
    a: "そのTikTokアカウントが「非公開アカウント」に設定されています。TikTokアプリの「設定とプライバシー」→「プライバシー」で非公開アカウントをオフにすると、「全員に公開」などが選べるようになります。",
  },
  {
    q: "時刻はどこの時間？",
    a: "投稿・予約まわりの時刻は、すべてロサンゼルス時間（LA）基準です。投稿ページと予約カレンダーにLAの現在時刻が表示されています。夏時間の切り替えも自動で反映されます。",
  },
  {
    q: "「商用コンテンツの開示」とは？",
    a: "自社の商品・サービスの宣伝や、企業から対価を受けた宣伝（タイアップ）を含む動画の場合にオンにする項目です。オンにすると、TikTok上で「プロモーション」などのラベルが表示されます。該当しない動画ではオフのままで構いません。",
  },
  {
    q: "アナリティクスに数値が出ない・古い",
    a: "まず右上の「🔄 更新」を押してください（チーム同期の設定が必要です）。それでも出ない場合は、期間の絞り込みを「全期間」にしてみてください。期間は「動画を投稿した日」で絞り込まれるため、その期間に投稿が無いと表示されません。",
  },
  {
    q: "平均視聴時間・保存数・視聴者の年代や性別は見られない？",
    a: "見られません。これらはTikTokが外部ツール向けに提供していない数値のため、Postonに限らず取得できません。TikTokアプリ内の分析画面でご確認ください。写真（画像）投稿の数値も同様に取得できません。",
  },
  {
    q: "アカウントを追加しようとすると、同じアカウントでログインされてしまう",
    a: "ブラウザに残っているTikTokのログイン状態が使われるためです。認証画面に表示されるQRコードを、追加したいアカウントでログイン中のスマホのTikTokアプリで読み取ってください。シークレットウィンドウで追加すると保存されないため、通常のウィンドウで行ってください。",
  },
  {
    q: "「再ログインが必要です」と表示された",
    a: "そのアカウントのログイン期限が切れています。表示されている「ログインし直す」から、同じアカウントでもう一度ログインしてください。",
  },
  {
    q: "アカウントの連携をやめたい",
    a: "サイドバーのアカウント名の右にある「ログアウト」を押すと、このブラウザでの連携が解除されます。TikTok側の許可そのものを取り消す場合は、TikTokアプリの「設定とプライバシー」→「セキュリティとアクセス許可」→「アプリの管理」から行えます。",
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
            Postonは、複数のTikTokアカウントの<strong>「投稿・予約」と「分析」</strong>を1か所でまとめて行える運用ツールです。
            動画の投稿、決まった時刻への自動投稿、投稿後の数値の確認までを、この画面で完結できます。
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
          <h2 className="text-lg font-bold mb-4">はじめかた（4ステップ）</h2>
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

        {/* 3つの投稿方法 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-4">3つの投稿方法</h2>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 text-left">
                    <th className="px-5 py-3 whitespace-nowrap">方法</th>
                    <th className="px-5 py-3">こんなときに</th>
                    <th className="px-5 py-3">どうなるか</th>
                  </tr>
                </thead>
                <tbody>
                  {投稿方法.map((m) => (
                    <tr key={m.name} className="border-b border-gray-200 dark:border-gray-800 last:border-b-0 align-top">
                      <td className="px-5 py-3.5 font-bold text-sm whitespace-nowrap">{m.name}</td>
                      <td className="px-5 py-3.5 text-gray-600 dark:text-gray-300 leading-relaxed">{m.when}</td>
                      <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 leading-relaxed">{m.how}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mt-3">
            公開範囲は毎回ご自身で選びます（初期値はありません）。コメント・デュエット・スティッチは、許可したいものだけチェックを入れてください。
          </p>
        </section>

        {/* 予約カレンダーの見方 */}
        <section className="mb-10">
          <h2 className="text-lg font-bold mb-2">予約カレンダーの見方</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-4">
            「投稿」ページ上部の「予約カレンダー」タブで開けます。カレンダー表示とリスト表示を切り替えられ、チーム同期を設定したメンバー全員が同じ予約を確認できます。
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl px-6 py-2 divide-y divide-gray-200 dark:divide-gray-800">
            {カレンダー凡例.map((c) => (
              <div key={c.name} className="flex gap-4 py-4 items-start">
                <div className="w-7 text-center text-base shrink-0">{c.mark}</div>
                <div>
                  <h3 className="font-bold text-sm mb-0.5">{c.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{c.desc}</p>
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
