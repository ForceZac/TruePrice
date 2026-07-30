import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CategoryProductCard } from "../ProductCard";
import type { CategoryProductItem } from "@/lib/types";

const WITH_ESTIMATE: CategoryProductItem = {
  id: "prod-1",
  name: "Classic Cotton T-Shirt",
  brand: "BasicWear",
  imageUrl: null,
  retailPriceCents: 2499,
  estimatedCostCents: 350,
  markupPercent: 614,
};

const WITHOUT_ESTIMATE: CategoryProductItem = {
  id: "prod-2",
  name: "Dark Chocolate Bar",
  brand: "AlpenSweet",
  imageUrl: null,
  retailPriceCents: 399,
  estimatedCostCents: null,
  markupPercent: null,
};

describe("CategoryProductCard", () => {
  it("renders product name", () => {
    render(<CategoryProductCard product={WITH_ESTIMATE} />);
    expect(screen.getByText("Classic Cotton T-Shirt")).toBeInTheDocument();
  });

  it("renders brand when present", () => {
    render(<CategoryProductCard product={WITH_ESTIMATE} />);
    expect(screen.getByText("BasicWear")).toBeInTheDocument();
  });

  it("renders markup % when estimate exists", () => {
    render(<CategoryProductCard product={WITH_ESTIMATE} />);
    expect(screen.getByText(/614%\s*markup/i)).toBeInTheDocument();
  });

  it("shows 'Estimate pending' when no cost breakdown", () => {
    render(<CategoryProductCard product={WITHOUT_ESTIMATE} />);
    expect(screen.getByText(/estimate pending/i)).toBeInTheDocument();
  });

  it("does not render markup info for unestimated product", () => {
    render(<CategoryProductCard product={WITHOUT_ESTIMATE} />);
    expect(screen.queryByText(/markup/i)).not.toBeInTheDocument();
  });

  it("renders 🔥 badge when isTop=true", () => {
    render(<CategoryProductCard product={WITH_ESTIMATE} isTop />);
    expect(screen.getByText(/highest markup/i)).toBeInTheDocument();
  });

  it("does not render 🔥 badge by default", () => {
    render(<CategoryProductCard product={WITH_ESTIMATE} />);
    expect(screen.queryByText(/highest markup/i)).not.toBeInTheDocument();
  });

  it("links to the product page", () => {
    render(<CategoryProductCard product={WITH_ESTIMATE} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/product/prod-1");
  });

  it("renders retail price when available", () => {
    render(<CategoryProductCard product={WITH_ESTIMATE} />);
    // $24.99
    expect(screen.getByText(/\$24\.99/i)).toBeInTheDocument();
  });
});
