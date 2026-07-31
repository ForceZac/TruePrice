import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { getWatchlist, getRecentlyViewed } from "@/services/UserService";
import { centsToUsd } from "@/lib/format";

export const metadata: Metadata = {
  title: "Dashboard — TruePrice",
  description: "Your saved products and recently viewed items on TruePrice.",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?next=/dashboard");
  }

  const [watchlist, recentlyViewed] = await Promise.all([
    getWatchlist(session.user.id),
    getRecentlyViewed(session.user.id),
  ]);

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-4xl mx-auto w-full gap-12">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {session.user.name ?? session.user.email}
          </p>
        </div>
        <Link
          href="/dashboard/settings"
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Settings
        </Link>
      </div>

      {/* Watchlist */}
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">
          Saved products{" "}
          <span className="text-muted-foreground font-normal text-sm">
            ({watchlist.length})
          </span>
        </h2>

        {watchlist.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No saved products yet.{" "}
            <Link href="/" className="underline hover:text-foreground">
              Browse products
            </Link>{" "}
            and hit the Save button to add them here.
          </p>
        ) : (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {watchlist.map(({ product, savedAt }) => {
              const breakdown = product.costBreakdowns[0] ?? null;
              return (
                <li key={product.id}>
                  <Link
                    href={`/product/${product.id}`}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition"
                  >
                    {product.imageUrl && (
                      <Image
                        src={product.imageUrl}
                        alt={product.name}
                        width={80}
                        height={80}
                        className="rounded object-cover self-center"
                      />
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm leading-snug line-clamp-2">
                        {product.name}
                      </span>
                      {product.brand && (
                        <span className="text-xs text-muted-foreground">
                          {product.brand}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                      {breakdown?.markupPercent != null ? (
                        <span className="font-medium text-foreground">
                          {breakdown.markupPercent.toFixed(0)}% markup
                        </span>
                      ) : (
                        <span>No estimate yet</span>
                      )}
                      {product.retailPriceCents != null && (
                        <span>{centsToUsd(product.retailPriceCents)}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Saved {new Date(savedAt).toLocaleDateString()}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Recently viewed</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentlyViewed.map(({ product, viewedAt }) => {
              const breakdown = product.costBreakdowns[0] ?? null;
              return (
                <li key={product.id}>
                  <Link
                    href={`/product/${product.id}`}
                    className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition"
                  >
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm leading-snug line-clamp-2">
                        {product.name}
                      </span>
                      {product.brand && (
                        <span className="text-xs text-muted-foreground">
                          {product.brand}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                      {breakdown?.markupPercent != null ? (
                        <span className="font-medium text-foreground">
                          {breakdown.markupPercent.toFixed(0)}% markup
                        </span>
                      ) : (
                        <span>No estimate yet</span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(viewedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </main>
  );
}
