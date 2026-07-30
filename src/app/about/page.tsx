import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/lib/env";

export const metadata: Metadata = {
  title: "About TruePrice — What Products Actually Cost",
  description:
    "TruePrice breaks down the real manufacturing cost of consumer products — raw materials, labor, and overhead — so you know the markup you're paying.",
};

export default function AboutPage() {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "TruePrice",
    url: env.NEXT_PUBLIC_APP_URL,
    description:
      "TruePrice reveals the true manufacturing cost of consumer products using commodity prices and industry-standard cost models.",
  };

  return (
    <main className="flex flex-col min-h-screen px-4 py-12 max-w-2xl mx-auto w-full gap-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationJsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <article className="flex flex-col gap-8">
        <div className="flex flex-col gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            About TruePrice
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            TruePrice answers one question: what does this thing actually cost
            to make?
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">The idea</h2>
          <p className="text-foreground/80 leading-relaxed">
            You scan a product at the grocery store or on Amazon and see a
            price. But the price is what the seller wants, not what the product
            cost to produce. There&apos;s usually a significant gap — and for
            most products, that gap is opaque.
          </p>
          <p className="text-foreground/80 leading-relaxed">
            TruePrice makes that gap visible. Scan a barcode or search for any
            product and see an estimate of what the raw materials, labor, and
            overhead actually cost — and how much of the retail price is pure
            margin.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">
            How estimates work
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            Each estimate is built from three layers:
          </p>
          <ul className="list-disc list-inside flex flex-col gap-2 text-foreground/80 leading-relaxed">
            <li>
              <strong>Raw materials</strong> — commodity prices (grains, metals,
              oils, etc.) from real-time market data, weighted by a
              product&apos;s ingredient list.
            </li>
            <li>
              <strong>Labor</strong> — an estimate based on the country of
              manufacture and industry-standard labor rates for the product
              category.
            </li>
            <li>
              <strong>Overhead</strong> — packaging, energy, and a standard
              factory overhead margin applied on top of materials and labor.
            </li>
          </ul>
          <p className="text-foreground/80 leading-relaxed">
            These are estimates, not audited figures. Actual costs vary by
            supplier, scale, and time. The{" "}
            <Link href="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>{" "}
            has more detail on what these numbers should and shouldn&apos;t be
            used for.
          </p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-semibold text-foreground">Who built it</h2>
          <p className="text-foreground/80 leading-relaxed">
            TruePrice is an independent project. If you have feedback,
            corrections, or just want to say hi, you can reach us on the{" "}
            <Link href="/contact" className="underline hover:text-foreground">
              contact page
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
