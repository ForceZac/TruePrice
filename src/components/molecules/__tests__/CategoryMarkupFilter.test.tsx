import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CategoryMarkupFilter } from "../CategoryMarkupFilter";
import type { CategoryProductItem } from "@/lib/types";

// ─── Fixtures ─────────────────────────────────────────────────────────────────

function makeProduct(
  id: string,
  name: string,
  markupPercent: number | null
): CategoryProductItem {
  return {
    id,
    name,
    brand: null,
    imageUrl: null,
    retailPriceCents: null,
    estimatedCostCents: null,
    markupPercent,
  };
}

const PRODUCTS: CategoryProductItem[] = [
  makeProduct("p1", "Cheap Widget", 150),      // under 3× (markupPercent < 300)
  makeProduct("p2", "Mid Widget", 450),         // 3–7× (300 ≤ x < 700)
  makeProduct("p3", "Expensive Widget", 850),   // over 7× (≥ 700)
  makeProduct("p4", "Unknown Widget", null),    // no estimate
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("CategoryMarkupFilter", () => {
  it("renders all filter badge options", () => {
    render(<CategoryMarkupFilter products={PRODUCTS} />);

    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Under 3×" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "3–7×" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Over 7×" })).toBeInTheDocument();
  });

  it("shows all products when All filter is active (default)", () => {
    render(<CategoryMarkupFilter products={PRODUCTS} />);

    expect(screen.getByText("Cheap Widget")).toBeInTheDocument();
    expect(screen.getByText("Mid Widget")).toBeInTheDocument();
    expect(screen.getByText("Expensive Widget")).toBeInTheDocument();
    expect(screen.getByText("Unknown Widget")).toBeInTheDocument();
  });

  it("filters to Under 3× when that badge is clicked", () => {
    render(<CategoryMarkupFilter products={PRODUCTS} />);

    fireEvent.click(screen.getByRole("button", { name: "Under 3×" }));

    expect(screen.getByText("Cheap Widget")).toBeInTheDocument();
    expect(screen.queryByText("Mid Widget")).not.toBeInTheDocument();
    expect(screen.queryByText("Expensive Widget")).not.toBeInTheDocument();
    // Products without markupPercent are excluded from non-All tiers
    expect(screen.queryByText("Unknown Widget")).not.toBeInTheDocument();
  });

  it("filters to 3–7× tier correctly", () => {
    render(<CategoryMarkupFilter products={PRODUCTS} />);

    fireEvent.click(screen.getByRole("button", { name: "3–7×" }));

    expect(screen.queryByText("Cheap Widget")).not.toBeInTheDocument();
    expect(screen.getByText("Mid Widget")).toBeInTheDocument();
    expect(screen.queryByText("Expensive Widget")).not.toBeInTheDocument();
  });

  it("filters to Over 7× tier correctly", () => {
    render(<CategoryMarkupFilter products={PRODUCTS} />);

    fireEvent.click(screen.getByRole("button", { name: "Over 7×" }));

    expect(screen.queryByText("Cheap Widget")).not.toBeInTheDocument();
    expect(screen.queryByText("Mid Widget")).not.toBeInTheDocument();
    expect(screen.getByText("Expensive Widget")).toBeInTheDocument();
  });

  it("shows empty message when no products match the filter", () => {
    const noneOver7: CategoryProductItem[] = [makeProduct("p1", "Widget", 100)];
    render(<CategoryMarkupFilter products={noneOver7} />);

    fireEvent.click(screen.getByRole("button", { name: "Over 7×" }));

    expect(screen.getByText("No products match this filter.")).toBeInTheDocument();
  });

  it("marks the active filter badge with aria-pressed=true", () => {
    render(<CategoryMarkupFilter products={PRODUCTS} />);

    // Default: All is active
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.click(screen.getByRole("button", { name: "3–7×" }));

    expect(screen.getByRole("button", { name: "3–7×" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false"
    );
  });
});
