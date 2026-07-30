import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdSlot } from "../AdSlot";

describe("AdSlot", () => {
  beforeEach(() => {
    // Reset adsbygoogle between tests
    Object.defineProperty(window, "adsbygoogle", {
      value: [],
      writable: true,
      configurable: true,
    });
  });

  it("renders the adsbygoogle ins element", () => {
    const { container } = render(<AdSlot slotId="test-slot" />);
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins).not.toBeNull();
  });

  it("sets data-ad-slot from slotId prop", () => {
    const { container } = render(<AdSlot slotId="my-slot-123" />);
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins).toHaveAttribute("data-ad-slot", "my-slot-123");
  });

  it("renders Advertisement label", () => {
    render(<AdSlot slotId="test-slot" />);
    expect(screen.getByText(/advertisement/i)).toBeInTheDocument();
  });

  it("applies min-height 90px wrapper for leaderboard format", () => {
    const { container } = render(
      <AdSlot slotId="test-slot" format="leaderboard" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("min-h-[90px]");
  });

  it("applies min-height 250px wrapper for auto format", () => {
    const { container } = render(
      <AdSlot slotId="test-slot" format="auto" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("min-h-[250px]");
  });

  it("applies min-height 250px wrapper for rectangle format", () => {
    const { container } = render(
      <AdSlot slotId="test-slot" format="rectangle" />
    );
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("min-h-[250px]");
  });

  it("sets data-ad-format and data-full-width-responsive for auto format", () => {
    const { container } = render(<AdSlot slotId="test-slot" format="auto" />);
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins).toHaveAttribute("data-ad-format", "auto");
    expect(ins).toHaveAttribute("data-full-width-responsive", "true");
  });

  it("does not set data-ad-format for rectangle format", () => {
    const { container } = render(
      <AdSlot slotId="test-slot" format="rectangle" />
    );
    const ins = container.querySelector("ins.adsbygoogle");
    expect(ins).not.toHaveAttribute("data-ad-format");
  });

  it("appends a push call to adsbygoogle on mount", () => {
    const pushSpy = vi.fn();
    Object.defineProperty(window, "adsbygoogle", {
      value: { push: pushSpy },
      writable: true,
      configurable: true,
    });
    render(<AdSlot slotId="test-slot" />);
    expect(pushSpy).toHaveBeenCalledWith({});
  });

  it("applies custom className to wrapper", () => {
    const { container } = render(
      <AdSlot slotId="test-slot" className="my-custom-class" />
    );
    expect(container.firstChild).toHaveClass("my-custom-class");
  });
});
