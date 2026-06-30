export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By using Poston, you agree to these Terms of Service. If you do not agree, please do not use our service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
            <p>Poston is a business tool that enables automated TikTok content posting and analytics tracking for multiple accounts. The service integrates with TikTok's API and Google Workspace.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. User Responsibilities</h2>
            <p>Users are responsible for ensuring all content posted through Poston complies with TikTok's Community Guidelines and Terms of Service. Users must not use Poston to post illegal, harmful, or infringing content.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. TikTok API Usage</h2>
            <p>Poston uses TikTok's official API. Usage is subject to TikTok's API Terms of Service. We are not responsible for any changes to TikTok's API or policies that may affect service functionality.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Limitation of Liability</h2>
            <p>Poston is provided "as is" without warranties. We are not liable for any damages arising from the use or inability to use the service.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Contact</h2>
            <p>For inquiries regarding these terms, please contact <a href="mailto:otuka.y@al-bo.io" className="text-white underline">otuka.y@al-bo.io</a></p>
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
