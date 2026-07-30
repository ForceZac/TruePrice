import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CompareTray } from "../CompareTray";
import { useCompareStore } from "@/store/compareStore";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

beforeEach(() => {
  useCompareStore.setState({ items: [] });
  mockPush.mockClear();
});

describe("CompareTray", () => {
  it("renders nothing when tray is empty", () => {
    const { container } = render(<CompareTray />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders when one product is staged", () => {
    useCompareStore.setState({ items: [{ id: "p1", name: "Widget A" }] });
    render(<CompareTray />);
    expect(screen.getByText("Widget A")).toBeInTheDocument();
  });

  it("renders both products when two are staged", () => {
    useCompareStore.setState({
      items: [
        { id: "p1", name: "Widget A" },
        { id: "p2", name: "Widget B" },
      ],
    });
    render(<CompareTray />);
    expect(screen.getByText("Widget A")).toBeInTheDocument();
    expect(screen.getByText("Widget B")).toBeInTheDocument();
  });

  it("shows hint text with one product staged", () => {
    useCompareStore.setState({ items: [{ id: "p1", name: "Widget A" }] });
    render(<CompareTray />);
    expect(screen.getByText("Add one more product to compare")).toBeInTheDocument();
  });

  it("remove button unstages a product", () => {
    useCompareStore.setState({ items: [{ id: "p1", name: "Widget A" }] });
    render(<CompareTray />);
    fireEvent.click(screen.getByRole("button", { name: "Remove Widget A from comparison" }));
    expect(useCompareStore.getState().items).toHaveLength(0);
  });

  it("Clear button empties the tray", () => {
    useCompareStore.setState({
      items: [
        { id: "p1", name: "Widget A" },
        { id: "p2", name: "Widget B" },
      ],
    });
    render(<CompareTray />);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(useCompareStore.getState().items).toHaveLength(0);
  });

  it("Compare button is disabled with fewer than 2 products", () => {
    useCompareStore.setState({ items: [{ id: "p1", name: "Widget A" }] });
    render(<CompareTray />);
    expect(screen.getByRole("button", { name: /compare/i })).toBeDisabled();
  });

  it("Compare button is enabled with 2 products staged", () => {
    useCompareStore.setState({
      items: [
        { id: "p1", name: "Widget A" },
        { id: "p2", name: "Widget B" },
      ],
    });
    render(<CompareTray />);
    expect(screen.getByRole("button", { name: /compare/i })).not.toBeDisabled();
  });

  it("Compare button navigates to compare page with both product IDs", () => {
    useCompareStore.setState({
      items: [
        { id: "p1", name: "Widget A" },
        { id: "p2", name: "Widget B" },
      ],
    });
    render(<CompareTray />);
    fireEvent.click(screen.getByRole("button", { name: /compare/i }));
    expect(mockPush).toHaveBeenCalledWith("/compare?a=p1&b=p2");
  });

  it("renders the comparison tray region landmark", () => {
    useCompareStore.setState({ items: [{ id: "p1", name: "Widget A" }] });
    render(<CompareTray />);
    expect(screen.getByRole("region", { name: "Product comparison tray" })).toBeInTheDocument();
  });
});
