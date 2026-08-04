import Link from "next/link";
import { ScanLine, Trophy, Zap } from "lucide-react";
import { SearchInput } from "@/components/molecules/SearchInput";
import { CategoryCard } from "@/components/molecules/CategoryCard";
import { getAllCategories } from "@/services/CategoryService";
import { getMostShocking } from "@/services/DiscoveryService";

export const revalidate = 3600;

export default async function Home() {
  const [categories, shocking] = await Promise.all([
    getAllCategories(),
    getMostShocking(3),
  ]);

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-24 gap-16">
      {/* Hero */}
      <div className="flex flex-col items-center gap-6 text-center max-w-2xl w-full">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          TruePrice
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Find out what products actually cost to make — and how much you&apos;re
          paying above that.
        </p>

        <div className="flex items-center gap-3 w-full mt-4">
          <div className="flex-1">
            <SearchInput placeholder="Search for a product or enter a name…" />
          </div>
          <Link
            href="/scan"
            aria-label="Scan barcode"
            className="flex items-center justify-center h-14 w-14 rounded-full border border-input bg-background text-foreground shadow-sm hover:bg-muted transition shrink-0"
          >
            <ScanLine className="h-6 w-6" aria-hidden="true" />
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          Search for any product by name, or scan the barcode to look it up.
        </p>
      </div>

      {/* Most Shocking Markups */}
      {shocking.length > 0 && (
        <section aria-labelledby="shocking-heading" className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" aria-hidden="true" />
              <h2
                id="shocking-heading"
                className="text-lg font-semibold text-foreground"
              >
                Most Shocking Markups
              </h2>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            {shocking.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition"
              >
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <p className="font-semibold text-foreground truncate">{product.name}</p>
                  <p className="text-sm text-muted-foreground truncate">{product.category}</p>
                </div>
                <span className="text-lg font-bold text-foreground shrink-0">
                  {(product.markupPercent / 100).toFixed(1)}×
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Category grid */}
      {categories.length > 0 && (
        <section aria-labelledby="categories-heading" className="w-full max-w-2xl">
          <div className="flex items-center justify-between mb-4">
            <h2
              id="categories-heading"
              className="text-lg font-semibold text-foreground"
            >
              Browse by Category
            </h2>
            <Link
              href="/categories"
              className="text-sm text-muted-foreground hover:text-foreground transition"
            >
              View all →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </section>
      )}

      {/* Hall of Shame teaser */}
      <section aria-labelledby="leaderboard-heading" className="w-full max-w-2xl">
        <Link
          href="/leaderboard"
          className="flex items-center gap-4 rounded-xl border border-border bg-card p-5 hover:bg-muted/50 transition group"
        >
          <Trophy className="h-8 w-8 text-primary shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h2
              id="leaderboard-heading"
              className="font-semibold text-foreground group-hover:text-primary transition"
            >
              Hall of Shame
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              The most marked-up products on TruePrice — ranked by markup %
            </p>
          </div>
          <span className="ml-auto text-muted-foreground group-hover:text-foreground transition shrink-0">
            →
          </span>
        </Link>
      </section>
    </main>
  );
}
