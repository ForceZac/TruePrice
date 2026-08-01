"use client";

import { useRouter } from "next/navigation";
import { useRef, useTransition, useEffect, useState, useCallback, type FormEvent, type KeyboardEvent } from "react";
import { useSession } from "next-auth/react";
import { Search, Clock } from "lucide-react";

const RECENT_SEARCHES_KEY = "tp-recent-searches";
const MAX_LOCAL_RECENT = 5;

interface AutocompleteProduct {
  id: string;
  name: string;
  category: string;
  categorySlug?: string | null;
}

interface SearchInputProps {
  defaultValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

function getLocalRecentSearches(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveLocalRecentSearch(query: string) {
  if (typeof window === "undefined") return;
  try {
    const existing = getLocalRecentSearches();
    const updated = [query, ...existing.filter((q) => q !== query)].slice(
      0,
      MAX_LOCAL_RECENT
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch {
    // localStorage unavailable; skip
  }
}

/**
 * SearchInput — search field with autocomplete dropdown and recent searches.
 *
 * - Typing ≥2 chars shows up to 6 autocomplete suggestions (debounced 250ms).
 * - When empty, shows up to 5 recent searches from localStorage (+ DB for
 *   authenticated users).
 * - Keyboard: ArrowDown/ArrowUp to navigate, Enter to select, Escape to close.
 */
export function SearchInput({
  defaultValue = "",
  placeholder = "Search for a product…",
  autoFocus = false,
}: SearchInputProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPending, startTransition] = useTransition();

  const [inputValue, setInputValue] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<AutocompleteProduct[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLoading, setIsLoading] = useState(false);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    setRecentSearches(getLocalRecentSearches());
  }, []);

  // Fetch recent searches from DB when authenticated
  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/user/recent-searches")
      .then((r) => r.json())
      .then((data: { searches?: string[] }) => {
        if (Array.isArray(data.searches) && data.searches.length > 0) {
          setRecentSearches(data.searches.slice(0, MAX_LOCAL_RECENT));
        }
      })
      .catch(() => {
        // DB fetch failed; local storage is still shown
      });
  }, [session?.user]);

  const fetchSuggestions = useCallback(async (q: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/products/search?q=${encodeURIComponent(q)}&autocomplete=true&limit=6`
      );
      const data = await res.json() as { products?: AutocompleteProduct[] };
      setSuggestions(data.products ?? []);
    } catch {
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setInputValue(val);
    setActiveIndex(-1);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => {
        void fetchSuggestions(val.trim());
        setIsOpen(true);
      }, 250);
    } else {
      setSuggestions([]);
      setIsOpen(val.length === 0 && recentSearches.length > 0);
    }
  }

  function handleFocus() {
    if (inputValue.trim().length === 0 && recentSearches.length > 0) {
      setIsOpen(true);
    } else if (inputValue.trim().length >= 2 && suggestions.length > 0) {
      setIsOpen(true);
    }
  }

  function handleBlur(e: React.FocusEvent) {
    // Close unless focus moved inside the container
    if (!containerRef.current?.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
      setActiveIndex(-1);
    }
  }

  function navigateTo(productId: string) {
    setIsOpen(false);
    setActiveIndex(-1);
    startTransition(() => {
      router.push(`/product/${productId}`);
    });
  }

  function submitSearch(query: string) {
    const q = query.trim();
    if (!q) return;
    saveLocalRecentSearch(q);
    setRecentSearches(getLocalRecentSearches());
    if (session?.user) {
      void fetch("/api/user/recent-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q }),
      });
    }
    setIsOpen(false);
    setActiveIndex(-1);
    startTransition(() => {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    });
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? "";
    if (!q) return;

    // If an autocomplete item is active, navigate to it directly
    if (activeIndex >= 0 && activeIndex < suggestions.length) {
      navigateTo(suggestions[activeIndex].id);
      return;
    }

    submitSearch(q);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (!isOpen) return;

    const items = suggestions.length > 0 ? suggestions : [];
    const count = items.length;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % count);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + count) % count);
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Enter" && activeIndex >= 0 && activeIndex < suggestions.length) {
      e.preventDefault();
      navigateTo(suggestions[activeIndex].id);
    }
  }

  const showRecent = isOpen && inputValue.trim().length === 0 && recentSearches.length > 0;
  const showSuggestions = isOpen && suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <form onSubmit={handleSubmit} role="search">
        <label htmlFor="search-input" className="sr-only">
          Search products
        </label>
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none z-10"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          name="q"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          disabled={isPending}
          autoComplete="off"
          aria-label="Product search"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `search-item-${activeIndex}` : undefined
          }
          className="w-full rounded-full border border-input bg-background pl-12 pr-6 py-4 text-base shadow-sm outline-none focus:ring-2 focus:ring-ring transition disabled:opacity-60"
        />
      </form>

      {/* Autocomplete dropdown */}
      {(showSuggestions || showRecent) && (
        <ul
          role="listbox"
          aria-label="Search suggestions"
          className="absolute z-50 top-full left-0 right-0 mt-1 rounded-xl border border-border bg-background shadow-lg overflow-hidden"
        >
          {showRecent && (
            <>
              <li className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider select-none">
                Recent searches
              </li>
              {recentSearches.map((q, idx) => (
                <li key={q} role="option" aria-selected={false}>
                  <button
                    type="button"
                    id={`search-item-${idx}`}
                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-muted/60 text-left"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setInputValue(q);
                      submitSearch(q);
                    }}
                  >
                    <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                    <span className="truncate">{q}</span>
                  </button>
                </li>
              ))}
            </>
          )}

          {showSuggestions && (
            <>
              {isLoading && (
                <li className="px-4 py-2.5 text-sm text-muted-foreground">
                  Searching…
                </li>
              )}
              {!isLoading &&
                suggestions.map((product, idx) => (
                  <li key={product.id} role="option" aria-selected={idx === activeIndex}>
                    <button
                      type="button"
                      id={`search-item-${idx}`}
                      className={`flex items-center gap-3 w-full px-4 py-2.5 text-left hover:bg-muted/60 ${
                        idx === activeIndex ? "bg-muted/60" : ""
                      }`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        navigateTo(product.id);
                      }}
                    >
                      <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" aria-hidden="true" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-foreground truncate">
                          {product.name}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {product.category}
                        </span>
                      </div>
                    </button>
                  </li>
                ))}
            </>
          )}
        </ul>
      )}
    </div>
  );
}
