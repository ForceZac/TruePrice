import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Breadcrumb } from "../Breadcrumb";

const ITEMS = [
  { label: "Home", href: "/" },
  { label: "Categories", href: "/categories" },
  { label: "Clothing & Textiles", href: "/category/clothing-textiles" },
  { label: "Classic Cotton T-Shirt", href: "/product/abc123" },
];

describe("Breadcrumb", () => {
  it("renders all breadcrumb labels", () => {
    render(<Breadcrumb items={ITEMS} />);
    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByText("Clothing & Textiles")).toBeInTheDocument();
    expect(screen.getByText("Classic Cotton T-Shirt")).toBeInTheDocument();
  });

  it("marks the last item as current page", () => {
    render(<Breadcrumb items={ITEMS} />);
    const current = screen.getByText("Classic Cotton T-Shirt");
    expect(current).toHaveAttribute("aria-current", "page");
  });

  it("renders intermediate items as links", () => {
    render(<Breadcrumb items={ITEMS} />);
    const homeLink = screen.getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("href", "/");
    const categoriesLink = screen.getByRole("link", { name: "Categories" });
    expect(categoriesLink).toHaveAttribute("href", "/categories");
  });

  it("last item is not a link", () => {
    render(<Breadcrumb items={ITEMS} />);
    // Should have exactly 3 links (Home, Categories, Clothing) not 4
    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(ITEMS.length - 1);
  });

  it("injects a BreadcrumbList JSON-LD script tag", () => {
    const { container } = render(<Breadcrumb items={ITEMS} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const parsed = JSON.parse(script!.textContent ?? "{}");
    expect(parsed["@type"]).toBe("BreadcrumbList");
    expect(parsed.itemListElement).toHaveLength(ITEMS.length);
  });

  it("JSON-LD positions are 1-indexed", () => {
    const { container } = render(<Breadcrumb items={ITEMS} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.textContent ?? "{}");
    expect(parsed.itemListElement[0].position).toBe(1);
    expect(parsed.itemListElement[ITEMS.length - 1].position).toBe(ITEMS.length);
  });

  it("JSON-LD item hrefs match provided hrefs", () => {
    const { container } = render(<Breadcrumb items={ITEMS} />);
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.textContent ?? "{}");
    ITEMS.forEach((item, i) => {
      expect(parsed.itemListElement[i].item).toBe(item.href);
      expect(parsed.itemListElement[i].name).toBe(item.label);
    });
  });

  it("works with a single item", () => {
    render(<Breadcrumb items={[{ label: "Home", href: "/" }]} />);
    const current = screen.getByText("Home");
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link")).toBeNull();
  });

  it("renders the nav landmark", () => {
    render(<Breadcrumb items={ITEMS} />);
    expect(screen.getByRole("navigation", { name: /breadcrumb/i })).toBeInTheDocument();
  });
});
