import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  /**
   * Base URL used to build absolute hrefs in the BreadcrumbList JSON-LD.
   * Google requires absolute URLs; omitting this falls back to relative paths
   * which produce invalid structured data.
   * Example: "https://trueprice.com"
   */
  baseUrl?: string;
}

/**
 * Breadcrumb navigation with BreadcrumbList JSON-LD structured data.
 *
 * Items are rendered in order; the last item is the current page (no link).
 * Includes a <script type="application/ld+json"> with BreadcrumbList schema.
 * Pass `baseUrl` so JSON-LD item hrefs are absolute (required by Google).
 */
export function Breadcrumb({ items, baseUrl }: BreadcrumbProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: baseUrl ? `${baseUrl}${item.href}` : item.href,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1 text-sm text-muted-foreground flex-wrap">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <li key={item.href} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0"
                    aria-hidden="true"
                  />
                )}
                {isLast ? (
                  <span className="text-foreground font-medium" aria-current="page">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-foreground transition truncate max-w-[160px]"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
