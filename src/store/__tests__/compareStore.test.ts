import { describe, it, expect, beforeEach } from "vitest";
import { useCompareStore } from "../compareStore";

describe("compareStore", () => {
  beforeEach(() => {
    useCompareStore.setState({ items: [] });
  });

  it("initializes with empty items", () => {
    expect(useCompareStore.getState().items).toHaveLength(0);
  });

  it("addItem stages a product", () => {
    useCompareStore.getState().addItem({ id: "abc", name: "Widget A" });
    expect(useCompareStore.getState().items).toHaveLength(1);
    expect(useCompareStore.getState().items[0]).toEqual({ id: "abc", name: "Widget A" });
  });

  it("addItem is a no-op when item is already staged", () => {
    useCompareStore.getState().addItem({ id: "abc", name: "Widget A" });
    useCompareStore.getState().addItem({ id: "abc", name: "Widget A" });
    expect(useCompareStore.getState().items).toHaveLength(1);
  });

  it("addItem allows two different products", () => {
    useCompareStore.getState().addItem({ id: "abc", name: "Widget A" });
    useCompareStore.getState().addItem({ id: "def", name: "Widget B" });
    expect(useCompareStore.getState().items).toHaveLength(2);
  });

  it("addItem replaces the oldest when at cap of 2", () => {
    useCompareStore.getState().addItem({ id: "abc", name: "Widget A" });
    useCompareStore.getState().addItem({ id: "def", name: "Widget B" });
    useCompareStore.getState().addItem({ id: "ghi", name: "Widget C" });
    const items = useCompareStore.getState().items;
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe("def");
    expect(items[1].id).toBe("ghi");
  });

  it("removeItem unstages a product by id", () => {
    useCompareStore.getState().addItem({ id: "abc", name: "Widget A" });
    useCompareStore.getState().addItem({ id: "def", name: "Widget B" });
    useCompareStore.getState().removeItem("abc");
    expect(useCompareStore.getState().items).toHaveLength(1);
    expect(useCompareStore.getState().items[0].id).toBe("def");
  });

  it("removeItem is a no-op for an unknown id", () => {
    useCompareStore.getState().addItem({ id: "abc", name: "Widget A" });
    useCompareStore.getState().removeItem("zzz");
    expect(useCompareStore.getState().items).toHaveLength(1);
  });

  it("clearItems empties the tray", () => {
    useCompareStore.getState().addItem({ id: "abc", name: "Widget A" });
    useCompareStore.getState().addItem({ id: "def", name: "Widget B" });
    useCompareStore.getState().clearItems();
    expect(useCompareStore.getState().items).toHaveLength(0);
  });
});
