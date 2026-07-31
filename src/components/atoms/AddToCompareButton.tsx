"use client";

import { PlusCircle, CheckCircle2 } from "lucide-react";
import { useCompareStore } from "@/store/compareStore";

interface Props {
  productId: string;
  productName: string;
}

/**
 * Stages a product in the compareStore for side-by-side comparison.
 * Shows a check when the product is already in the tray.
 */
export function AddToCompareButton({ productId, productName }: Props) {
  const { items, addItem, removeItem } = useCompareStore();
  const isStaged = items.some((i) => i.id === productId);

  function handleClick() {
    if (isStaged) {
      removeItem(productId);
    } else {
      addItem({ id: productId, name: productName });
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
        isStaged
          ? "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
          : "border-border bg-background text-foreground shadow-sm hover:bg-muted"
      }`}
      aria-label={isStaged ? `Remove ${productName} from comparison` : `Add ${productName} to comparison`}
      aria-pressed={isStaged}
    >
      {isStaged ? (
        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      ) : (
        <PlusCircle className="h-4 w-4" aria-hidden="true" />
      )}
      {isStaged ? "In tray" : "Compare"}
    </button>
  );
}
