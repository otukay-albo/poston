export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      <header className="flex items-center gap-3 px-8 py-5 bg-black border-b border-gray-800">
        <a href="/" className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Poston" className="w-9 h-9 rounded-xl" />
          <span className="text-white font-bold text-xl tracking-wide">Poston</span>
        </a>
      </header>

      <div className="max-w-3xl mx-auto px-8 py-16 flex-1">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: July 12, 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
            <p>
              These Terms of Service (&ldquo;Terms&rdquo;) govern your use of Poston (&ldquo;the Service&rdquo;),
              operated by 株式会社CrescenDo (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). By accessing or using
              Poston and by connecting a TikTok account, you agree to these Terms. If you do not agree, do not
              use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. Description of the Service</h2>
            <p>
              Poston is a business tool that lets authorized users analyze and manage multiple TikTok accounts
              from a single dashboard and publish videos directly to their own TikTok profiles through
              TikTok&rsquo;s official APIs (Login Kit, Display API, and Content Posting API).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Accounts and Eligibility</h2>
            <p>
              You must be authorized to manage the TikTok account(s) you connect, and you must meet the minimum
              age required to hold a TikTok account. You are responsible for maintaining the security of your
              access to Poston and for all activity carried out through the accounts you connect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. TikTok Integration</h2>
            <p>
              Poston integrates with TikTok using TikTok&rsquo;s official APIs and OAuth 2.0. Your use of TikTok
              through Poston is also subject to TikTok&rsquo;s own Terms of Service, Community Guidelines, and
              Developer / Content Sharing Guidelines. Poston is an independent tool and is not endorsed by,
              affiliated with, or sponsored by TikTok. We are not responsible for changes TikTok makes to its
              APIs or policies that may affect the functionality of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. Acceptable Use</h2>
            <p className="mb-3">You agree not to use Poston to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                post content that is illegal, infringing, or harmful, or that violates TikTok&rsquo;s Community
                Guidelines or Terms of Service;
              </li>
              <li>
                infringe the intellectual property, publicity, or privacy rights of others, including using
                music or other media you are not licensed to use;
              </li>
              <li>
                attempt to gain unauthorized access to, interfere with, overload, or misuse the Service or
                TikTok&rsquo;s systems.
              </li>
            </ul>
            <p className="mt-3">You are solely responsible for the content you publish through Poston.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Your Content</h2>
            <p>
              You retain all ownership rights to the videos, captions, and other content you upload or publish
              through Poston. You grant us the limited permission necessary to process and transmit that content
              to TikTok in order to provide the posting feature at your direction. We do not claim ownership of
              your content.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Intellectual Property</h2>
            <p>
              The Service itself, including its software, design, and branding, is owned by us and protected by
              applicable laws. These Terms do not grant you any rights in our intellectual property other than
              the right to use the Service as intended.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Disclaimers</h2>
            <p>
              The Service is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis, without
              warranties of any kind, whether express or implied. We do not warrant that the Service will be
              uninterrupted or error-free, or that analytics data will be complete or accurate.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
              special, or consequential damages, or for any loss of data, profits, or business, arising out of
              or related to your use of, or inability to use, the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Termination</h2>
            <p>
              You may stop using the Service at any time by disconnecting your TikTok account(s). We may suspend
              or terminate access to the Service if these Terms are violated, or where necessary to comply with
              TikTok&rsquo;s policies or applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Changes to These Terms</h2>
            <p>
              We may modify these Terms from time to time. Material changes will be indicated by updating the
              &ldquo;Last updated&rdquo; date. Your continued use of the Service after changes take effect
              constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">12. Governing Law</h2>
            <p>
              These Terms are governed by the laws of Japan, without regard to its conflict-of-law principles.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">13. Contact</h2>
            <p>
              Poston is operated by 株式会社CrescenDo (CrescenDo Inc.).<br />
              Website:{" "}
              <a href="https://cresc-buzz.com/" target="_blank" rel="noreferrer" className="text-white underline">https://cresc-buzz.com/</a><br />
              Email:{" "}
              <a href="mailto:otuka.y@al-bo.io" className="text-white underline">otuka.y@al-bo.io</a>
            </p>
          </section>
        </div>
      </div>

      <footer className="bg-black border-t border-gray-800 text-gray-500 text-sm text-center py-6">
        <p>© 2026 Poston. Contact: otuka.y@al-bo.io</p>
      </footer>
    </main>
  );
}
