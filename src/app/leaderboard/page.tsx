import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { prisma } from "@/lib/db";
import { LeaderboardCard } from "@/components/molecules/LeaderboardCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Hall of Shame — Most Marked-Up Products — TruePrice",
  description:
    "The 20 most marked-up products on TruePrice, ranked by manufacturing markup percentage. See which products cost the least to make and sell for the most.",
};

export default async function LeaderboardPage() {
  const rows = await prisma.costBreakdown.findMany({
    where: { markupPercent: { not: null } },
    orderBy: { markupPercent: "desc" },
    take: 20,
    select: {
      id: true,
      totalCostCents: true,
      retailPriceCents: true,
      markupPercent: true,
      confidenceScore: true,
      confidence: true,
      confidenceReason: true,
      product: {
        select: {
          id: true,
          name: true,
          category: { select: { name: true } },
        },
      },
    },
  });

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-2xl mx-auto w-full gap-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition"
        >
          ← Home
        </Link>
        <div className="flex items-center gap-3">
          <Trophy className="h-7 w-7 text-primary" aria-hidden="true" />
          <h1 className="text-3xl font-bold text-foreground">Hall of Shame</h1>
        </div>
        <p className="text-muted-foreground">
          The most marked-up products on TruePrice — ranked by how much you overpay.
        </p>
      </div>

      {/* Leaderboard */}
      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border py-16 px-6 text-center">
          <p className="text-muted-foreground">
            No products with estimates yet. Search for a product and calculate its cost to get
            started.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition"
          >
            Search Products
          </Link>
        </div>
      ) : (
        <ol className="flex flex-col gap-3" aria-label="Leaderboard">
          {rows.map((row, index) => (
            <li key={row.id}>
              <LeaderboardCard
                rank={index + 1}
                id={row.product.id}
                name={row.product.name}
                category={row.product.category.name}
                markupPercent={row.markupPercent!}
                markupMultiplier={row.markupPercent! / 100 + 1}
                totalCostCents={row.totalCostCents}
                retailPriceCents={row.retailPriceCents}
                confidence={row.confidence}
                confidenceScore={row.confidenceScore}
              />
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
