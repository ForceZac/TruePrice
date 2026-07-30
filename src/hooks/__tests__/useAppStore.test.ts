import { describe, it, expect, beforeEach } from "vitest";
import { useAppStore } from "../useAppStore";

describe("useAppStore", () => {
  beforeEach(() => {
    useAppStore.setState({ searchQuery: "" });
  });

  it("initializes with empty searchQuery", () => {
    expect(useAppStore.getState().searchQuery).toBe("");
  });

  it("updates searchQuery via setSearchQuery", () => {
    useAppStore.getState().setSearchQuery("olive oil");
    expect(useAppStore.getState().searchQuery).toBe("olive oil");
  });

  it("replaces previous searchQuery on update", () => {
    useAppStore.getState().setSearchQuery("cotton");
    useAppStore.getState().setSearchQuery("steel");
    expect(useAppStore.getState().searchQuery).toBe("steel");
  });

  it("accepts empty string to clear query", () => {
    useAppStore.getState().setSearchQuery("something");
    useAppStore.getState().setSearchQuery("");
    expect(useAppStore.getState().searchQuery).toBe("");
  });
});
