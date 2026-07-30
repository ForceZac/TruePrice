import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — TruePrice",
  description: "How TruePrice uses cookies and handles your data.",
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <main className="flex flex-col min-h-screen px-4 py-12 max-w-2xl mx-auto w-full gap-8">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Privacy Policy
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: January 2026
        </p>

        <section className="mt-8 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            What data we collect
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            TruePrice does not require an account and does not collect personal
            information directly. When you visit, standard server logs may
            record your IP address and browser type for security and
            reliability purposes. These logs are not sold or shared with third
            parties and are deleted on a rolling basis.
          </p>
        </section>

        <section className="mt-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            Advertising &amp; cookies (Google AdSense)
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            TruePrice uses Google AdSense to show ads. If you accept cookies,
            Google and its partners may use cookies to serve ads based on your
            prior visits to this site and other sites. Google&apos;s use of
            advertising cookies enables it and its partners to serve ads to
            you based on your visit to TruePrice and/or other sites on the
            internet.
          </p>
          <p className="text-foreground/80 leading-relaxed">
            You may opt out of personalized advertising by visiting{" "}
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Google&apos;s Ads Settings
            </a>
            . If you decline cookies on this site, the AdSense script will not
            load.
          </p>
          <p className="text-foreground/80 leading-relaxed">
            For more information on how Google handles data, see{" "}
            <a
              href="https://policies.google.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-foreground"
            >
              Google&apos;s Privacy Policy
            </a>
            .
          </p>
        </section>

        <section className="mt-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            Third-party services
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            TruePrice may use third-party APIs (e.g., commodity pricing
            services, product barcode databases) to provide cost estimates.
            These services receive only the minimum data necessary to fulfill
            requests (such as a product barcode) and are not used for
            advertising.
          </p>
        </section>

        <section className="mt-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            Your choices
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            You can decline cookies when you first visit the site. You can
            also clear cookies at any time through your browser settings. If
            you have questions, please{" "}
            <Link href="/contact" className="underline hover:text-foreground">
              contact us
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
