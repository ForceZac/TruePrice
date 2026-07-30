import Link from "next/link";
import { ScanLine } from "lucide-react";
import { SearchInput } from "@/components/molecules/SearchInput";
import { CategoryCard } from "@/components/molecules/CategoryCard";
import { getAllCategories } from "@/services/CategoryService";

export const revalidate = 3600;

export default async function Home() {
  const categories = await getAllCategories();

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
    </main>
  );
}
