import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CookieConsent } from "../CookieConsent";

const CONSENT_KEY = "cookie_consent";
const CONSENT_EVENT = "cookie-consent-change";

describe("CookieConsent", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("shows the banner when no consent is stored", () => {
    render(<CookieConsent />);
    expect(
      screen.getByRole("dialog", { name: /cookie consent/i })
    ).toBeInTheDocument();
  });

  it("does not show banner when consent already stored", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    render(<CookieConsent />);
    expect(
      screen.queryByRole("dialog", { name: /cookie consent/i })
    ).toBeNull();
  });

  it("renders Accept and Decline buttons", () => {
    render(<CookieConsent />);
    expect(screen.getByRole("button", { name: /accept/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /decline/i })
    ).toBeInTheDocument();
  });

  it("accepting hides the banner and saves accepted to localStorage", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole("button", { name: /accept/i }));
    expect(
      screen.queryByRole("dialog", { name: /cookie consent/i })
    ).toBeNull();
    expect(localStorage.getItem(CONSENT_KEY)).toBe("accepted");
  });

  it("declining hides the banner and saves declined to localStorage", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole("button", { name: /decline/i }));
    expect(
      screen.queryByRole("dialog", { name: /cookie consent/i })
    ).toBeNull();
    expect(localStorage.getItem(CONSENT_KEY)).toBe("declined");
  });

  it("dispatches cookie-consent-change event on accept", () => {
    const handler = vi.fn();
    window.addEventListener(CONSENT_EVENT, handler);
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole("button", { name: /accept/i }));
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(CONSENT_EVENT, handler);
  });

  it("dispatches cookie-consent-change event on decline", () => {
    const handler = vi.fn();
    window.addEventListener(CONSENT_EVENT, handler);
    render(<CookieConsent />);
    fireEvent.click(screen.getByRole("button", { name: /decline/i }));
    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener(CONSENT_EVENT, handler);
  });

  it("includes a link to the privacy policy", () => {
    render(<CookieConsent />);
    const link = screen.getByRole("link", { name: /privacy policy/i });
    expect(link).toHaveAttribute("href", "/privacy");
  });
});
