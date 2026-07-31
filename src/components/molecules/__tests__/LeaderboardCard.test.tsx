import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LeaderboardCard } from "../LeaderboardCard";

const BASE_PROPS = {
  rank: 1,
  id: "000000000001",
  name: "Luxury T-Shirt",
  category: "Clothing & Textiles",
  markupPercent: 900,
  markupMultiplier: 10,
  totalCostCents: 300,
  retailPriceCents: 3000,
  confidence: "HIGH",
  confidenceScore: 0.9,
};

describe("LeaderboardCard", () => {
  it("renders rank number", () => {
    render(<LeaderboardCard {...BASE_PROPS} />);
    expect(screen.getByText("1")).toBeInTheDocument();
  });

  it("renders product name", () => {
    render(<LeaderboardCard {...BASE_PROPS} />);
    expect(screen.getByText("Luxury T-Shirt")).toBeInTheDocument();
  });

  it("renders category", () => {
    render(<LeaderboardCard {...BASE_PROPS} />);
    expect(screen.getByText("Clothing & Textiles")).toBeInTheDocument();
  });

  it("renders markup multiplier", () => {
    render(<LeaderboardCard {...BASE_PROPS} />);
    expect(screen.getByText("10.0×")).toBeInTheDocument();
  });

  it("renders markup percent", () => {
    render(<LeaderboardCard {...BASE_PROPS} />);
    expect(screen.getByText("900% markup")).toBeInTheDocument();
  });

  it("renders estimated cost", () => {
    render(<LeaderboardCard {...BASE_PROPS} />);
    expect(screen.getByText("$3.00")).toBeInTheDocument();
  });

  it("renders retail price when provided", () => {
    render(<LeaderboardCard {...BASE_PROPS} />);
    expect(screen.getByText("$30.00")).toBeInTheDocument();
  });

  it("omits retail price when null", () => {
    render(<LeaderboardCard {...BASE_PROPS} retailPriceCents={null} />);
    expect(screen.queryByText(/Retail/i)).not.toBeInTheDocument();
  });

  it("links to the product page", () => {
    render(<LeaderboardCard {...BASE_PROPS} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/product/000000000001");
  });
});
