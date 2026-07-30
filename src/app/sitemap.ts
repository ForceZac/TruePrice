import type { MetadataRoute } from "next";
import { getAllCategorySlugs } from "@/services/CategoryService";
import { env } from "@/lib/env";

/**
 * Generates the sitemap for TruePrice.
 *
 * Includes: home, categories index, and each individual category landing page.
 * Product pages are not included here to keep the sitemap focused on browsable
 * content that AdSense reviewers look for.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = env.NEXT_PUBLIC_APP_URL;
  const now = new Date();

  const slugs = await getAllCategorySlugs();

  const categoryEntries: MetadataRoute.Sitemap = slugs.map((slug) => ({
    url: `${base}/category/${slug}`,
    lastModified: now,
    changeFrequency: "daily",
    priority: 0.8,
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
  ];
}
