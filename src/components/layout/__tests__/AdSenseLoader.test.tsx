import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { AdSenseLoader } from "../AdSenseLoader";

// next/script renders nothing useful in jsdom — mock it so we can assert on the src prop
vi.mock("next/script", () => ({
  default: ({ src }: { src: string }) => (
    <script data-testid="adsense-script" src={src} />
  ),
}));

const PUBLISHER_ID = "ca-pub-1234567890";
const CONSENT_KEY = "cookie_consent";
const CONSENT_EVENT = "cookie-consent-change";

describe("AdSenseLoader", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when no consent is stored", () => {
    const { container } = render(<AdSenseLoader publisherId={PUBLISHER_ID} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing when consent is declined", () => {
    localStorage.setItem(CONSENT_KEY, "declined");
    const { container } = render(<AdSenseLoader publisherId={PUBLISHER_ID} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the AdSense script when consent is accepted", () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    render(<AdSenseLoader publisherId={PUBLISHER_ID} />);
    const script = screen.getByTestId("adsense-script");
    expect(script).toBeInTheDocument();
    expect(script).toHaveAttribute(
      "src",
      `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${PUBLISHER_ID}`
    );
  });

  it("loads the script after consent is given via event", async () => {
    // Start with no consent
    render(<AdSenseLoader publisherId={PUBLISHER_ID} />);
    expect(screen.queryByTestId("adsense-script")).toBeNull();

    // User accepts cookies
    await act(async () => {
      localStorage.setItem(CONSENT_KEY, "accepted");
      window.dispatchEvent(new Event(CONSENT_EVENT));
    });

    expect(screen.getByTestId("adsense-script")).toBeInTheDocument();
  });

  it("removes the script after consent is revoked via event", async () => {
    localStorage.setItem(CONSENT_KEY, "accepted");
    render(<AdSenseLoader publisherId={PUBLISHER_ID} />);
    expect(screen.getByTestId("adsense-script")).toBeInTheDocument();

    // User declines cookies
    await act(async () => {
      localStorage.setItem(CONSENT_KEY, "declined");
      window.dispatchEvent(new Event(CONSENT_EVENT));
    });

    expect(screen.queryByTestId("adsense-script")).toBeNull();
  });

  it("cleans up the event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
    const { unmount } = render(<AdSenseLoader publisherId={PUBLISHER_ID} />);
    unmount();
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      CONSENT_EVENT,
      expect.any(Function)
    );
  });
});
