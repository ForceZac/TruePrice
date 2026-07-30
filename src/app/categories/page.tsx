import type { Metadata } from "next";
import { getAllCategories } from "@/services/CategoryService";
import { CategoryCard } from "@/components/molecules/CategoryCard";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Browse by Category — TruePrice",
  description:
    "Explore products by category and discover the true manufacturing cost versus retail price. Find out which categories have the highest markups.",
  openGraph: {
    title: "Browse by Category — TruePrice",
    description:
      "Explore products by category and discover the true manufacturing cost versus retail price.",
    siteName: "TruePrice",
    type: "website",
  },
};

export default async function CategoriesPage() {
  const categories = await getAllCategories();

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-4xl mx-auto w-full gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Browse by Category
        </h1>
        <p className="text-muted-foreground">
          Pick a category to see products and their true manufacturing costs.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">
          No categories yet. Check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      )}
    </main>
  );
}
