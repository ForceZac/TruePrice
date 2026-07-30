import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddToCompareButton } from "../AddToCompareButton";
import { useCompareStore } from "@/store/compareStore";

beforeEach(() => {
  useCompareStore.setState({ items: [] });
});

describe("AddToCompareButton", () => {
  it("renders Compare label when product is not staged", () => {
    render(<AddToCompareButton productId="p1" productName="Widget A" />);
    expect(screen.getByText("Compare")).toBeInTheDocument();
  });

  it("renders In tray label when product is staged", () => {
    useCompareStore.setState({ items: [{ id: "p1", name: "Widget A" }] });
    render(<AddToCompareButton productId="p1" productName="Widget A" />);
    expect(screen.getByText("In tray")).toBeInTheDocument();
  });

  it("aria-pressed is false when not staged", () => {
    render(<AddToCompareButton productId="p1" productName="Widget A" />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-pressed", "false");
  });

  it("aria-pressed is true when staged", () => {
    useCompareStore.setState({ items: [{ id: "p1", name: "Widget A" }] });
    render(<AddToCompareButton productId="p1" productName="Widget A" />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-pressed", "true");
  });

  it("clicking stages the product", () => {
    render(<AddToCompareButton productId="p1" productName="Widget A" />);
    fireEvent.click(screen.getByRole("button"));
    expect(useCompareStore.getState().items).toHaveLength(1);
    expect(useCompareStore.getState().items[0]).toEqual({ id: "p1", name: "Widget A" });
  });

  it("clicking again unstages the product", () => {
    useCompareStore.setState({ items: [{ id: "p1", name: "Widget A" }] });
    render(<AddToCompareButton productId="p1" productName="Widget A" />);
    fireEvent.click(screen.getByRole("button"));
    expect(useCompareStore.getState().items).toHaveLength(0);
  });

  it("aria-label describes the action when not staged", () => {
    render(<AddToCompareButton productId="p1" productName="Widget A" />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Add Widget A to comparison"
    );
  });

  it("aria-label describes the action when staged", () => {
    useCompareStore.setState({ items: [{ id: "p1", name: "Widget A" }] });
    render(<AddToCompareButton productId="p1" productName="Widget A" />);
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-label",
      "Remove Widget A from comparison"
    );
  });
});
