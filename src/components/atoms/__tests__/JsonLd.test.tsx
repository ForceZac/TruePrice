import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { JsonLd } from "../JsonLd";

describe("JsonLd", () => {
  it("renders a script tag with type application/ld+json", () => {
    const data = { "@context": "https://schema.org", "@type": "Product", name: "Test" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });

  it("serialises the data object as JSON", () => {
    const data = { "@context": "https://schema.org", "@type": "Product", name: "Widget" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.textContent ?? "{}");
    expect(parsed["@type"]).toBe("Product");
    expect(parsed.name).toBe("Widget");
  });

  it("escapes < characters to prevent XSS", () => {
    const data = { name: "<script>alert(1)</script>" };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    // The raw HTML should not contain a literal < in the injected string
    expect(script!.innerHTML).not.toContain("<script>");
    expect(script!.innerHTML).toContain("\\u003cscript");
  });

  it("handles nested objects", () => {
    const data = {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "Electronics",
      numberOfItems: 42,
      url: "https://example.com/category/electronics",
    };
    const { container } = render(<JsonLd data={data} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.textContent ?? "{}");
    expect(parsed["@type"]).toBe("CollectionPage");
    expect(parsed.numberOfItems).toBe(42);
  });
});
