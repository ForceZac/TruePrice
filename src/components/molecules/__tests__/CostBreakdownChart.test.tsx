import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { CostBreakdownChart } from "../CostBreakdownChart";
import type { CostBreakdownResult } from "@/lib/api";

// Recharts uses ResizeObserver — stub it for jsdom
vi.stubGlobal(
  "ResizeObserver",
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
);

const BASE_BREAKDOWN: CostBreakdownResult = {
  id: "bd1",
  productId: "p1",
  materialCostCents: 300,
  laborCostCents: 150,
  overheadCostCents: 60,
  shippingCostCents: 100,
  totalCostCents: 610,
  retailPriceCents: 2999,
  markupPercent: 391.6,
  confidenceScore: 0.85,
  confidenceReason: "all 3 materials have commodity prices",
  methodology: "Material cost: commodity prices × material weights (3/3 materials priced).",
  calculatedAt: "2026-07-30T12:00:00Z",
};

describe("CostBreakdownChart", () => {
  it("renders without crashing with a full breakdown", () => {
    const { container } = render(<CostBreakdownChart breakdown={BASE_BREAKDOWN} />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders four segment labels in the summary list", () => {
    render(<CostBreakdownChart breakdown={BASE_BREAKDOWN} />);
    expect(screen.getByText("Materials")).toBeInTheDocument();
    expect(screen.getByText("Labor")).toBeInTheDocument();
    expect(screen.getByText("Overhead")).toBeInTheDocument();
    expect(screen.getByText("Shipping")).toBeInTheDocument();
  });

  it("shows total estimated cost in the summary list", () => {
    render(<CostBreakdownChart breakdown={BASE_BREAKDOWN} />);
    expect(screen.getByText("Total estimated cost")).toBeInTheDocument();
    // $6.10
    expect(screen.getByText("$6.10")).toBeInTheDocument();
  });

  it("excludes zero-value segments from the summary list", () => {
    const noShipping: CostBreakdownResult = {
      ...BASE_BREAKDOWN,
      shippingCostCents: 0,
    };
    render(<CostBreakdownChart breakdown={noShipping} />);
    // Zero-value segments are filtered — Shipping row should not appear
    expect(screen.queryByText("Shipping")).not.toBeInTheDocument();
    // Total still comes from totalCostCents (not recomputed by the component)
    expect(screen.getByText("$6.10")).toBeInTheDocument();
  });

  it("shows 'No cost data available' when all segments are zero", () => {
    const empty: CostBreakdownResult = {
      ...BASE_BREAKDOWN,
      materialCostCents: 0,
      laborCostCents: 0,
      overheadCostCents: 0,
      shippingCostCents: 0,
      totalCostCents: 0,
    };
    render(<CostBreakdownChart breakdown={empty} />);
    expect(screen.getByText("No cost data available.")).toBeInTheDocument();
  });
});
