import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryCard, CategoryCardSkeleton } from "../CategoryCard";
import type { CategorySummary } from "@/services/CategoryService";

const CATEGORY: CategorySummary = {
  id: "cat-1",
  name: "Clothing & Textiles",
  slug: "clothing-textiles",
  description: "Apparel and fabric-based goods.",
  productCount: 5,
  avgMarkupPercent: 250,
};

describe("CategoryCard", () => {
  it("renders the category name", () => {
    render(<CategoryCard category={CATEGORY} />);
    expect(screen.getByText("Clothing & Textiles")).toBeInTheDocument();
  });

  it("renders the product count", () => {
    render(<CategoryCard category={CATEGORY} />);
    expect(screen.getByText("5 products")).toBeInTheDocument();
  });

  it("renders singular 'product' for count of 1", () => {
    render(<CategoryCard category={{ ...CATEGORY, productCount: 1 }} />);
    expect(screen.getByText("1 product")).toBeInTheDocument();
  });

  it("renders average markup when present", () => {
    render(<CategoryCard category={CATEGORY} />);
    expect(screen.getByText("250% avg markup")).toBeInTheDocument();
  });

  it("renders 'No estimates yet' when avgMarkupPercent is null", () => {
    render(<CategoryCard category={{ ...CATEGORY, avgMarkupPercent: null }} />);
    expect(screen.getByText("No estimates yet")).toBeInTheDocument();
  });

  it("links to the category slug page", () => {
    render(<CategoryCard category={CATEGORY} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/category/clothing-textiles");
  });
});

describe("CategoryCardSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<CategoryCardSkeleton />);
    expect(container.firstChild).not.toBeNull();
  });
});
