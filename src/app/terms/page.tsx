import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — TruePrice",
  description: "Terms governing use of the TruePrice website.",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <main className="flex flex-col min-h-screen px-4 py-12 max-w-2xl mx-auto w-full gap-8">
      <article className="prose prose-neutral dark:prose-invert max-w-none">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Terms of Service
        </h1>
        <p className="text-sm text-muted-foreground">
          Last updated: January 2026
        </p>

        <section className="mt-8 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            Estimates are approximate
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            TruePrice provides estimated manufacturing costs for consumer
            products based on publicly available commodity prices, ingredient
            data, and industry-standard labor and overhead assumptions. These
            estimates are not audited, not guaranteed to be accurate, and
            should not be relied upon for financial, legal, business, or
            purchasing decisions.
          </p>
          <p className="text-foreground/80 leading-relaxed">
            Actual manufacturing costs vary by supplier, volume, location, and
            time. The estimates shown on TruePrice are informational only.
          </p>
        </section>

        <section className="mt-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            No warranty
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            This site is provided &quot;as is&quot; without any warranty of
            any kind, express or implied. We make no guarantee that the site
            will be available, error-free, or that the data will be complete or
            current.
          </p>
        </section>

        <section className="mt-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            Use of the site
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            You may use TruePrice for personal, non-commercial purposes. You
            may not scrape, reproduce, or redistribute TruePrice content in
            bulk without permission. The cost estimates and underlying
            methodologies are the intellectual property of TruePrice.
          </p>
        </section>

        <section className="mt-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            Limitation of liability
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            To the fullest extent permitted by law, TruePrice and its
            operators shall not be liable for any direct, indirect, incidental,
            or consequential damages arising from your use of this site or
            reliance on any information provided.
          </p>
        </section>

        <section className="mt-6 flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">Contact</h2>
          <p className="text-foreground/80 leading-relaxed">
            Questions about these terms? Please{" "}
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
