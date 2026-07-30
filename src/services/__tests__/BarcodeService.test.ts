import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock env before BarcodeService imports it
vi.mock("@/lib/env", () => ({
  env: {
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    NODE_ENV: "test",
    DATABASE_URL: "postgresql://test:test@localhost/test",
  },
}));

import { isValidBarcode, lookupByBarcode } from "@/services/BarcodeService";

// ─── isValidBarcode ───────────────────────────────────────────────────────────

describe("isValidBarcode", () => {
  it("accepts UPC-E (6 digits)", () => expect(isValidBarcode("012345")).toBe(true));
  it("accepts EAN-8 (8 digits)", () => expect(isValidBarcode("01234567")).toBe(true));
  it("accepts UPC-A (12 digits)", () => expect(isValidBarcode("012345678901")).toBe(true));
  it("accepts EAN-13 (13 digits)", () => expect(isValidBarcode("0123456789012")).toBe(true));

  it("rejects 7 digits", () => expect(isValidBarcode("0123456")).toBe(false));
  it("rejects 11 digits", () => expect(isValidBarcode("01234567890")).toBe(false));
  it("rejects letters", () => expect(isValidBarcode("ABC123")).toBe(false));
  it("rejects empty string", () => expect(isValidBarcode("")).toBe(false));
  it("trims whitespace before checking", () =>
    expect(isValidBarcode("  012345678901  ")).toBe(true));
});

// ─── lookupByBarcode — mocked fetch ───────────────────────────────────────────

describe("lookupByBarcode", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns null when Open Food Facts returns status 0", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: 0 }),
      })
    );

    const result = await lookupByBarcode("0123456789012");
    expect(result).toBeNull();
  });

  it("returns product from Open Food Facts when found", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 1,
          product: {
            product_name_en: "Test Chocolate Bar",
            brands: "TestBrand",
            ingredients_text_en: "Sugar, Cocoa butter, Milk powder",
            image_front_url: "https://example.com/img.jpg",
            categories: "Chocolates",
            countries_tags: ["en:switzerland"],
            product_quantity: "100 g",
          },
        }),
      })
    );

    const result = await lookupByBarcode("0123456789012");
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Test Chocolate Bar");
    expect(result?.brand).toBe("TestBrand");
    expect(result?.source).toBe("openfoodfacts");
    expect(result?.countryOfOrigin).toBe("CH");
    expect(result?.weightGrams).toBe(100);
  });

  it("falls back to UPCitemdb when OFF returns nothing", async () => {
    let callCount = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // OFF returns not found
          return Promise.resolve({
            ok: true,
            json: async () => ({ status: 0 }),
          });
        }
        // UPCitemdb returns a product
        return Promise.resolve({
          ok: true,
          json: async () => ({
            code: "OK",
            items: [
              {
                title: "Generic Widget",
                brand: "Widgetco",
                category: "Electronics",
                images: ["https://example.com/widget.jpg"],
                ean: "0123456789012",
              },
            ],
          }),
        });
      })
    );

    const result = await lookupByBarcode("0123456789012");
    expect(result).not.toBeNull();
    expect(result?.name).toBe("Generic Widget");
    expect(result?.source).toBe("upcitemdb");
  });

  it("returns null when both APIs fail", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => ({}),
      })
    );

    const result = await lookupByBarcode("0123456789012");
    expect(result).toBeNull();
  });
});
