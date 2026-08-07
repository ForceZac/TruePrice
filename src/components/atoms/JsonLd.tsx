/**
 * JsonLd — renders a <script type="application/ld+json"> tag safely.
 *
 * Always call from a Server Component (page or layout). Never import this
 * from a client component — structured data must be part of the initial HTML.
 */

interface JsonLdProps {
  data: Record<string, unknown>;
}

/**
 * Serialise JSON-LD data into a script tag. The `<` character is escaped to
 * prevent XSS when the JSON is embedded in HTML.
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}
