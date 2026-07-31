/**
 * /admin/coverage
 *
 * Server component — no auth required for v1.
 * Shows product coverage stats: total products, breakdown by confidence tier,
 * and a per-category table.
 */

import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface TierCounts {
  HIGH: number;
  MEDIUM: number;
  LOW: number;
  none: number;
}

interface CategoryRow {
  name: string;
  slug: string;
  total: number;
  high: number;
  medium: number;
  low: number;
  noEstimate: number;
}

async function getCoverageData(): Promise<{
  total: number;
  tiers: TierCounts;
  categories: CategoryRow[];
}> {
  const [products, breakdowns, categories] = await Promise.all([
    prisma.product.findMany({ select: { id: true, categoryId: true } }),
    prisma.costBreakdown.findMany({
      distinct: ["productId"],
      orderBy: { calculatedAt: "desc" },
      select: { productId: true, confidence: true },
    }),
    prisma.productCategory.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    }),
  ]);

  // Map productId → latest confidence tier
  const confidenceByProduct = new Map<string, string>(
    breakdowns.map((b) => [b.productId, b.confidence])
  );

  const tiers: TierCounts = { HIGH: 0, MEDIUM: 0, LOW: 0, none: 0 };
  for (const p of products) {
    const tier = confidenceByProduct.get(p.id);
    if (tier === "HIGH") tiers.HIGH++;
    else if (tier === "MEDIUM") tiers.MEDIUM++;
    else if (tier === "LOW") tiers.LOW++;
    else tiers.none++;
  }

  // Per-category breakdown
  const productsByCategory = new Map<string, string[]>();
  for (const p of products) {
    const arr = productsByCategory.get(p.categoryId) ?? [];
    arr.push(p.id);
    productsByCategory.set(p.categoryId, arr);
  }

  const categoryRows: CategoryRow[] = categories.map((cat) => {
    const ids = productsByCategory.get(cat.id) ?? [];
    const row: CategoryRow = {
      name: cat.name,
      slug: cat.slug,
      total: ids.length,
      high: 0,
      medium: 0,
      low: 0,
      noEstimate: 0,
    };
    for (const id of ids) {
      const tier = confidenceByProduct.get(id);
      if (tier === "HIGH") row.high++;
      else if (tier === "MEDIUM") row.medium++;
      else if (tier === "LOW") row.low++;
      else row.noEstimate++;
    }
    return row;
  });

  return { total: products.length, tiers, categories: categoryRows };
}

export default async function CoveragePage() {
  const { total, tiers, categories } = await getCoverageData();

  const withEstimate = tiers.HIGH + tiers.MEDIUM + tiers.LOW;
  const coveragePct = total > 0 ? Math.round((withEstimate / total) * 100) : 0;

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Product Coverage Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Admin view — no authentication required in v1.
      </p>

      {/* Stat blocks */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <StatBlock label="Total Products" value={total} />
        <StatBlock label="Coverage" value={`${coveragePct}%`} sub={`${withEstimate} with estimate`} />
        <StatBlock label="HIGH Confidence" value={tiers.HIGH} sub="product-specific data" accent="text-green-600" />
        <StatBlock label="MEDIUM Confidence" value={tiers.MEDIUM} sub="subcategory profile" accent="text-yellow-600" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-10">
        <StatBlock label="LOW Confidence" value={tiers.LOW} sub="category average" accent="text-orange-600" />
        <StatBlock label="No Estimate" value={tiers.none} sub="not yet computed" accent="text-muted-foreground" />
      </div>

      {/* Category table */}
      <h2 className="text-xl font-semibold mb-4">By Category</h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <Th>Category</Th>
              <Th align="right">Total</Th>
              <Th align="right">HIGH</Th>
              <Th align="right">MEDIUM</Th>
              <Th align="right">LOW</Th>
              <Th align="right">None</Th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.slug} className="border-t border-border hover:bg-muted/40 transition-colors">
                <td className="px-4 py-3 font-medium">{cat.name}</td>
                <Td>{cat.total}</Td>
                <Td className="text-green-600 font-semibold">{cat.high}</Td>
                <Td className="text-yellow-600 font-semibold">{cat.medium}</Td>
                <Td className="text-orange-600 font-semibold">{cat.low}</Td>
                <Td className="text-muted-foreground">{cat.noEstimate}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function StatBlock({
  label,
  value,
  sub,
  accent = "text-foreground",
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-border p-4 bg-card">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-3xl font-bold ${accent}`}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th className={`px-4 py-3 font-semibold text-muted-foreground text-${align}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={`px-4 py-3 text-right ${className}`}>
      {children}
    </td>
  );
}
