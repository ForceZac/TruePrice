import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { EstimateSkeleton } from "../EstimateSkeleton";

describe("EstimateSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<EstimateSkeleton />);
    expect(container.firstChild).not.toBeNull();
  });

  it("has a status role for accessibility", () => {
    render(<EstimateSkeleton />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("has an accessible label", () => {
    render(<EstimateSkeleton />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Loading cost estimate…"
    );
  });

  it("includes an sr-only loading message for screen readers", () => {
    render(<EstimateSkeleton />);
    const srText = screen.getByText("Loading cost estimate…");
    expect(srText).toHaveClass("sr-only");
  });

  it("renders multiple shimmer placeholder elements", () => {
    const { container } = render(<EstimateSkeleton />);
    const shimmers = container.querySelectorAll(".animate-pulse");
    expect(shimmers.length).toBeGreaterThan(3);
  });
});
