export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center gap-3 px-8 py-5 bg-black border-b border-gray-800">
        <a href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <span className="text-black font-bold text-xl">P</span>
          </div>
          <span className="text-white font-bold text-xl tracking-wide">Poston</span>
        </a>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-16 flex-1">
        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
            <p>Poston collects TikTok account information (display name, avatar) and video analytics data (views, likes, comments, shares) through the TikTok API. We do not store passwords or personal identification information.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
            <p>Collected data is used solely to provide analytics dashboards and automate content posting on your behalf. Data is stored in Google Spreadsheets accessible only to authorized users.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Data Sharing</h2>
            <p>We do not sell, trade, or share your data with third parties. Data is only shared with TikTok as required to provide our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Data Retention</h2>
            <p>Analytics data is retained in your Google Spreadsheet until you choose to delete it. Access tokens are stored securely and automatically refreshed.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Security</h2>
            <p>We use industry-standard security measures to protect your data. OAuth 2.0 is used for TikTok authentication.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Contact</h2>
            <p>For privacy-related inquiries, please contact us at <a href="mailto:otuka.y@al-bo.io" className="text-white underline">otuka.y@al-bo.io</a></p>
          </section>

          <p className="text-gray-500 text-sm">Last updated: June 2026</p>
        </div>
      </div>

      <footer className="bg-black border-t border-gray-800 text-gray-500 text-sm text-center py-6">
        <p>© 2026 Poston. Contact: otuka.y@al-bo.io</p>
      </footer>
    </main>
  );
}
