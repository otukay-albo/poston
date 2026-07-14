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
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: July 12, 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <p>
              Poston (&ldquo;the Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;), operated by AL-BO,
              provides a dashboard that helps businesses analyze and manage multiple TikTok accounts and
              publish videos to TikTok. This Privacy Policy explains what information we collect through the
              Service, how we use, store, share, and protect it, and the choices you have. By using Poston and
              connecting your TikTok account, you agree to the practices described here.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
            <p className="mb-3">
              We collect the following information through TikTok&rsquo;s official APIs, and only after you
              authorize access using TikTok Login (OAuth 2.0):
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">TikTok profile information</strong> (Login Kit / user.info):
                your TikTok open ID, display name, avatar image, and aggregate account statistics such as
                follower count, following count, total likes, and video count.
              </li>
              <li>
                <strong className="text-white">Your TikTok video data</strong> (Display API / video.list):
                video IDs, titles and descriptions, cover images, publication dates, and engagement metrics
                (view, like, comment, and share counts) for videos on the account you authorize.
              </li>
              <li>
                <strong className="text-white">Content you choose to publish</strong> (Content Posting API):
                the video files and captions you upload through Poston to post to your own TikTok profile,
                together with the posting options you select (privacy level and comment/duet/stitch settings).
              </li>
            </ul>
            <p className="mt-3">
              We do not collect your TikTok password. Authentication is handled entirely by TikTok through
              OAuth 2.0.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
            <p className="mb-3">We use the information solely to provide the Service, specifically to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>display analytics dashboards about your TikTok account and videos;</li>
              <li>allow you to publish videos directly to your own TikTok profile at your request;</li>
              <li>let you connect, manage, and switch between multiple authorized TikTok accounts.</li>
            </ul>
            <p className="mt-3">
              We do not use your information for advertising or profiling, and we do not sell it.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">3. Where and How We Store Data</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong className="text-white">Access and refresh tokens</strong> are stored locally in your web
                browser (localStorage) on your own device, to keep you signed in and to refresh access
                automatically. They are not stored on our servers.
              </li>
              <li>
                <strong className="text-white">Video statistics</strong> used for analytics are stored in our
                database (Supabase) so that performance trends can be tracked over time.
              </li>
              <li>
                <strong className="text-white">Uploaded videos</strong> are transmitted directly from your
                browser to TikTok&rsquo;s servers to complete the post; we do not permanently store your video
                files.
              </li>
            </ul>
            <p className="mt-3">
              We apply reasonable technical and organizational measures to protect data, including encryption in
              transit (HTTPS) and access-controlled storage.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">4. Service Providers (Sub-processors)</h2>
            <p className="mb-3">
              We use the following third-party providers strictly to operate the Service. They process data only
              on our behalf and under agreements consistent with this Policy:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Vercel Inc.</strong> — application hosting.</li>
              <li><strong className="text-white">Supabase Inc.</strong> — database hosting for analytics data.</li>
              <li>
                <strong className="text-white">Google LLC (Google Apps Script)</strong> — automated collection of
                your authorized account&rsquo;s public video statistics.
              </li>
            </ul>
            <p className="mt-3">
              We do not otherwise share, sell, rent, or trade your information. Data is shared with TikTok only
              as necessary to provide the features you request (for example, publishing a video).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">5. TikTok Data and Compliance</h2>
            <p>
              Our access to and use of TikTok data complies with the TikTok Developer Terms of Service and the
              TikTok Developer and Content Sharing Guidelines. TikTok data obtained through the APIs is used only
              to provide the Poston features described in this Policy and for no other purpose.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">6. Data Retention and Deletion</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                You can disconnect a TikTok account from Poston at any time by logging out, which removes the
                stored tokens from your browser.
              </li>
              <li>
                You can also revoke Poston&rsquo;s access in your TikTok account settings
                (Settings &rarr; Security &amp; permissions &rarr; Manage app permissions). Once access is
                revoked, Poston can no longer access your TikTok account.
              </li>
              <li>
                Analytics data stored in our database is retained to provide historical trends. You may request
                deletion of your stored analytics data at any time by contacting us, and we will delete it.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">7. Your Rights</h2>
            <p>
              Depending on your location, you may have the right to access, correct, or delete your personal
              information and to withdraw consent. To exercise these rights, contact us at the address below. You
              may also revoke access directly through TikTok as described in Section 6.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">8. Children&rsquo;s Privacy</h2>
            <p>
              Poston is a business tool intended for adults who operate TikTok accounts on behalf of a business.
              It is not directed to children, and we do not knowingly collect information from anyone below the
              minimum age required to hold a TikTok account.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">9. International Users</h2>
            <p>
              The Service is operated from Japan. If you access it from another region, you consent to the
              processing of your information in Japan and by the service providers listed in Section 4.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">10. Changes to This Policy</h2>
            <p>
              We may update this Policy from time to time. Material changes will be indicated by updating the
              &ldquo;Last updated&rdquo; date at the top of this page.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">11. Contact</h2>
            <p>
              Poston (operated by AL-BO)<br />
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
