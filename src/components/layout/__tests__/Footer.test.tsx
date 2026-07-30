import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Footer } from "../Footer";

describe("Footer", () => {
  it("renders the About link", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: /about/i });
    expect(link).toHaveAttribute("href", "/about");
  });

  it("renders the Privacy Policy link", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: /privacy policy/i });
    expect(link).toHaveAttribute("href", "/privacy");
  });

  it("renders the Terms link", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: /terms/i });
    expect(link).toHaveAttribute("href", "/terms");
  });

  it("renders the Contact link", () => {
    render(<Footer />);
    const link = screen.getByRole("link", { name: /contact/i });
    expect(link).toHaveAttribute("href", "/contact");
  });

  it("renders a footer landmark", () => {
    render(<Footer />);
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });
});
