"use client";

import { useState } from "react";
import type { RefObject } from "react";
import { Button } from "@/components/ui/button";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  /** Ref to the DOM node to capture as a PNG. No-op if null at click time. */
  chartRef: RefObject<HTMLElement | null>;
  /** Used to construct the download filename: trueprice-{slug}.png */
  productName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Downloads the cost breakdown section as a 2× PNG.
 *
 * `dom-to-image-more` is lazy-loaded on click to avoid adding ~45 kB to the
 * initial page bundle. No sign-in is required.
 */
export function SaveAsImageButton({ chartRef, productName }: Props) {
  const [isPending, setIsPending] = useState(false);

  async function handleClick() {
    const node = chartRef.current;
    if (!node) return;

    setIsPending(true);
    try {
      // Lazy-load to keep it out of the initial page bundle
      const { default: domtoimage } = await import("dom-to-image-more");
      const dataUrl = await domtoimage.toPng(node, { scale: 2 });

      const a = document.createElement("a");
      a.download = `trueprice-${toSlug(productName)}.png`;
      a.href = dataUrl;
      a.click();
    } catch {
      // Silent fail — browser may block canvas taint or DOM capture in some
      // edge cases (e.g. cross-origin images). User simply won't get a download.
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
    >
      {isPending ? "Saving…" : "Save as Image"}
    </Button>
  );
}
