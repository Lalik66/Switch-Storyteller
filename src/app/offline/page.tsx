/**
 * Offline fallback — served by the service worker when a navigation
 * request cannot reach the network and there is no cached copy.
 *
 * Shipped as a static Server Component so the worker can pre-cache it
 * during install. Bilingual copy (EN/AZ) is rendered side-by-side
 * because we cannot rely on the language-provider state (cached HTML
 * is a snapshot of one render). See PRD §6 for language scope.
 */

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline",
  description:
    "You are offline. Previously opened tales remain readable; new pages await your return.",
  robots: { index: false, follow: false },
};

export default function OfflinePage() {
  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      <div className="mx-auto max-w-xl text-center">
        <p className="eyebrow">§ Threshold · No signal</p>

        <h1 className="display-lg mt-6 text-[clamp(2.6rem,5.5vw,4.4rem)] leading-[0.95]">
          The wind has
          <br />
          <span className="italic-wonk text-[color:var(--ember)]">
            stilled the wires.
          </span>
        </h1>

        <div
          className="rule-ornament mx-auto my-8 max-w-xs"
          aria-hidden="true"
        >
          <svg width="14" height="14" viewBox="0 0 24 24">
            <path
              d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"
              fill="currentColor"
            />
          </svg>
        </div>

        <p className="mx-auto max-w-md font-[var(--font-newsreader)] text-[15.5px] leading-relaxed text-foreground/70">
          The Forge is offline for the moment. Tales already opened in this
          cabin remain readable — try{" "}
          <a
            href="/dashboard"
            className="text-[color:var(--ember)] underline underline-offset-4 hover:no-underline"
          >
            your library
          </a>
          . New chapters will arrive when the connection returns.
        </p>

        <p className="mx-auto mt-4 max-w-md font-[var(--font-newsreader)] text-[14px] italic leading-relaxed text-foreground/55">
          Forge bağlantısız rejimdədir. Daha əvvəl açılmış nağıllar
          oxunaqlıdır — bağlantı qayıdanda yeni səhifələr gələcək.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            data-offline-retry
            className="btn-ember justify-center"
          >
            Try the connection again
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <a href="/dashboard" className="btn-ghost-ink">
            Return to the workshop
          </a>
        </div>

        {/* Tiny inline reload hook — keeps the page free of a client */}
        {/* component import while still letting the button trigger a  */}
        {/* fresh navigation when the network comes back.              */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.addEventListener('click', function (e) {
                var t = e.target;
                while (t && t !== document) {
                  if (t.dataset && t.dataset.offlineRetry !== undefined) {
                    e.preventDefault();
                    location.reload();
                    return;
                  }
                  t = t.parentNode;
                }
              });
            `,
          }}
        />
      </div>
    </section>
  );
}
