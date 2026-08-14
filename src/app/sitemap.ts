import type { MetadataRoute } from "next";
import { getAllCategorySlugs } from "@/services/CategoryService";
import { getAllProductIds } from "@/services/ProductService";
import { env } from "@/lib/env";

/**
 * Generates the sitemap for TruePrice.
 *
 * Includes: home, categories index, each category landing page, and each
 * individual product page.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL;
  const now = new Date();

  const [slugs, productIds] = await Promise.all([
    getAllCategorySlugs(),
    getAllProductIds(),
  ]);

  const categoryEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${base}/category/${slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const productEntries: MetadataRoute.Sitemap = productIds.map((id) => ({
    url: `${base}/product/${id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${base}/categories`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...categoryEntries,
    ...productEntries,
  ];
}
