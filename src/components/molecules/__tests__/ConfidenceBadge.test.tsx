import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfidenceBadge } from "../ConfidenceBadge";

const REASON = "all 3 materials have commodity prices";

describe("ConfidenceBadge", () => {
  it("shows High for score >= 0.7", () => {
    render(<ConfidenceBadge confidenceScore={0.85} confidenceReason={REASON} />);
    expect(screen.getByText(/high confidence/i)).toBeInTheDocument();
  });

  it("shows Medium for score in [0.4, 0.7)", () => {
    render(<ConfidenceBadge confidenceScore={0.55} confidenceReason={REASON} />);
    expect(screen.getByText(/medium confidence/i)).toBeInTheDocument();
  });

  it("shows Low for score < 0.4", () => {
    render(<ConfidenceBadge confidenceScore={0.2} confidenceReason={REASON} />);
    expect(screen.getByText(/low confidence/i)).toBeInTheDocument();
  });

  it("shows the percentage score", () => {
    render(<ConfidenceBadge confidenceScore={0.85} confidenceReason={REASON} />);
    expect(screen.getByText("85%")).toBeInTheDocument();
  });

  it("hides reason text by default (collapsed)", () => {
    render(<ConfidenceBadge confidenceScore={0.85} confidenceReason={REASON} />);
    expect(screen.queryByText(REASON)).not.toBeInTheDocument();
  });

  it("reveals reason text when expanded", () => {
    render(<ConfidenceBadge confidenceScore={0.85} confidenceReason={REASON} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(screen.getByText(REASON)).toBeInTheDocument();
  });

  it("collapses reason text on second click", () => {
    render(<ConfidenceBadge confidenceScore={0.85} confidenceReason={REASON} />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    fireEvent.click(button);
    expect(screen.queryByText(REASON)).not.toBeInTheDocument();
  });

  it("boundary: score exactly 0.7 maps to High", () => {
    render(<ConfidenceBadge confidenceScore={0.7} confidenceReason={REASON} />);
    expect(screen.getByText(/high confidence/i)).toBeInTheDocument();
  });

  it("boundary: score exactly 0.4 maps to Medium", () => {
    render(<ConfidenceBadge confidenceScore={0.4} confidenceReason={REASON} />);
    expect(screen.getByText(/medium confidence/i)).toBeInTheDocument();
  });
});
