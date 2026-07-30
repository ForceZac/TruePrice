"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition, type FormEvent } from "react";
import { Search } from "lucide-react";

interface SearchInputProps {
  defaultValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

/**
 * SearchInput — controlled text search field.
 * Submitting navigates to /search?q=<query>.
 */
export function SearchInput({
  defaultValue = "",
  placeholder = "Search for a product…",
  autoFocus = false,
}: SearchInputProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? "";
    if (!q) return;

    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full" role="search">
      <label htmlFor="search-input" className="sr-only">
        Search products
      </label>
      <Search
        className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        id="search-input"
        type="search"
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoFocus={autoFocus}
        disabled={isPending}
        className="w-full rounded-full border border-input bg-background pl-12 pr-6 py-4 text-base shadow-sm outline-none focus:ring-2 focus:ring-ring transition disabled:opacity-60"
        aria-label="Product search"
      />
    </form>
  );
}
