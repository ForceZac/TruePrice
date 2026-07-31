import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { RefObject } from "react";
import { SaveAsImageButton } from "../SaveAsImageButton";

// ─── Mock dom-to-image-more ───────────────────────────────────────────────────

const mockToPng = vi.fn().mockResolvedValue("data:image/png;base64,abc123");

vi.mock("dom-to-image-more", () => ({
  default: { toPng: mockToPng },
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeRef(el: HTMLElement | null): RefObject<HTMLElement | null> {
  return { current: el } as RefObject<HTMLElement | null>;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockToPng.mockClear();
});

describe("SaveAsImageButton", () => {
  it("renders a button with the correct label", () => {
    render(<SaveAsImageButton chartRef={makeRef(null)} productName="Widget" />);
    expect(screen.getByRole("button", { name: "Save as Image" })).toBeInTheDocument();
  });

  it("button is always enabled (no auth gate)", () => {
    render(<SaveAsImageButton chartRef={makeRef(null)} productName="Widget" />);
    expect(screen.getByRole("button")).not.toBeDisabled();
  });

  it("does nothing when chartRef.current is null", async () => {
    render(<SaveAsImageButton chartRef={makeRef(null)} productName="Widget" />);
    fireEvent.click(screen.getByRole("button"));
    // Drain microtasks
    await new Promise((r) => setTimeout(r, 0));
    expect(mockToPng).not.toHaveBeenCalled();
  });

  it("calls toPng with the captured node and scale 2", async () => {
    const divEl = document.createElement("div");
    render(<SaveAsImageButton chartRef={makeRef(divEl)} productName="Widget" />);
    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(mockToPng).toHaveBeenCalledWith(divEl, { scale: 2 }));
  });

  it("creates a download link with the correct filename", async () => {
    const divEl = document.createElement("div");

    const mockAnchor = { download: "", href: "", click: vi.fn() };
    // Save original before spying to avoid infinite recursion
    const origCreate = document.createElement.bind(document);
    const createSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        if (tag === "a") return mockAnchor as unknown as HTMLElement;
        return origCreate(tag) as HTMLElement;
      });

    render(
      <SaveAsImageButton chartRef={makeRef(divEl)} productName="Cool T-Shirt" />
    );
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(mockAnchor.click).toHaveBeenCalled());
    expect(mockAnchor.download).toBe("trueprice-cool-t-shirt.png");
    expect(mockAnchor.href).toBe("data:image/png;base64,abc123");

    createSpy.mockRestore();
  });

  it("slugifies the product name in the filename", async () => {
    const divEl = document.createElement("div");

    const mockAnchor = { download: "", href: "", click: vi.fn() };
    const origCreate = document.createElement.bind(document);
    const createSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        if (tag === "a") return mockAnchor as unknown as HTMLElement;
        return origCreate(tag) as HTMLElement;
      });

    render(
      <SaveAsImageButton
        chartRef={makeRef(divEl)}
        productName="Fancy Widget (Pro) 2026!"
      />
    );
    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => expect(mockAnchor.click).toHaveBeenCalled());
    expect(mockAnchor.download).toBe("trueprice-fancy-widget-pro-2026.png");

    createSpy.mockRestore();
  });

  it("does not throw when toPng rejects", async () => {
    mockToPng.mockRejectedValueOnce(new Error("canvas taint"));
    const divEl = document.createElement("div");
    render(<SaveAsImageButton chartRef={makeRef(divEl)} productName="Widget" />);

    // Should not throw
    expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
    // Give the promise time to settle
    await new Promise((r) => setTimeout(r, 0));
  });
});
