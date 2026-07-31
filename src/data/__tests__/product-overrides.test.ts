import { describe, it, expect } from "vitest";
import { getProductOverride } from "@/data/product-overrides";

describe("getProductOverride", () => {
  it("returns null when neither upc nor ean is provided", () => {
    expect(getProductOverride(null, null)).toBeNull();
    expect(getProductOverride(undefined, undefined)).toBeNull();
  });

  it("returns null for unknown UPC", () => {
    expect(getProductOverride("000000000000", null)).toBeNull();
  });

  it("returns null for unknown EAN", () => {
    expect(getProductOverride(null, "0000000000000")).toBeNull();
  });

  it("returns null for empty string UPC and EAN", () => {
    // Empty strings are falsy — treated as no value
    expect(getProductOverride("", "")).toBeNull();
  });
});
