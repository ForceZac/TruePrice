"use client";

import { useRouter } from "next/navigation";
import { X, ArrowLeftRight } from "lucide-react";
import { useCompareStore } from "@/store/compareStore";

/**
 * Floating comparison tray rendered at the bottom of the screen.
 * Hidden when no products are staged. Shows 1–2 product chips with
 * individual remove buttons, a Clear button, and a Compare button.
 */
export function CompareTray() {
  const { items, removeItem, clearItems } = useCompareStore();
  const router = useRouter();

  if (items.length === 0) return null;

  function handleCompare() {
    if (items.length < 2) return;
    router.push(`/compare?a=${items[0].id}&b=${items[1].id}`);
  }

  return (
    <div
      role="region"
      aria-label="Product comparison tray"
      className="fixed bottom-0 inset-x-0 z-50 bg-background border-t border-border shadow-lg"
    >
      <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
        {/* Product chips */}
        <div className="flex flex-1 items-center gap-2 min-w-0 flex-wrap">
          {items.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm text-foreground max-w-[180px]"
            >
              <span className="truncate">{item.name}</span>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`Remove ${item.name} from comparison`}
                className="shrink-0 rounded-full hover:bg-muted-foreground/20 p-0.5 transition"
              >
                <X className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
              </button>
            </span>
          ))}
          {items.length === 1 && (
            <span className="text-sm text-muted-foreground">
              Add one more product to compare
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={clearItems}
            className="text-sm text-muted-foreground hover:text-foreground transition"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={handleCompare}
            disabled={items.length < 2}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
            Compare
          </button>
        </div>
      </div>
    </div>
  );
}
