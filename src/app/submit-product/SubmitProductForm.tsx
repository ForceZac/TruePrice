"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  initialUpc?: string;
  categories: Category[];
}

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function SubmitProductForm({ initialUpc = "", categories }: Props) {
  const router = useRouter();
  const [upc, setUpc] = useState(initialUpc);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [prefilling, setPrefilling] = useState(false);

  // Auto-prefill from barcode when initialUpc is provided
  useEffect(() => {
    if (!initialUpc) return;
    setPrefilling(true);
    fetch(`/api/products/upc-prefill?upc=${encodeURIComponent(initialUpc)}`)
      .then((r) => r.json())
      .then((data: { found: boolean; data?: { name?: string; brand?: string } }) => {
        if (data.found && data.data) {
          if (data.data.name) setName(data.data.name);
          if (data.data.brand) setBrand(data.data.brand);
        }
      })
      .catch(() => {
        // Prefill is best-effort — don't block the form
      })
      .finally(() => setPrefilling(false));
  }, [initialUpc]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!upc.trim() || !name.trim() || !categoryId) {
      setError("UPC, product name, and category are required.");
      return;
    }

    const retailCents =
      retailPrice.trim()
        ? Math.round(parseFloat(retailPrice) * 100)
        : undefined;

    if (retailPrice.trim() && (isNaN(retailCents!) || retailCents! < 0)) {
      setError("Retail price must be a valid positive number.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/products/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          upc: upc.trim(),
          name: name.trim(),
          brand: brand.trim() || undefined,
          categoryId,
          retailPriceCents: retailCents,
        }),
      });

      const data = await res.json() as { error?: string; productUrl?: string | null };

      if (res.status === 409) {
        if (data.productUrl) {
          router.push(data.productUrl);
          return;
        }
        setError("This product already exists in our catalog.");
        return;
      }

      if (!res.ok) {
        setError(data.error ?? "Failed to submit product. Please try again.");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6 text-center">
        <h2 className="text-lg font-semibold text-foreground">Submission received!</h2>
        <p className="text-sm text-muted-foreground">
          Thanks for contributing. We&apos;ll review your submission and email you when it&apos;s approved.
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => router.push("/")}>
            Go home
          </Button>
          <Button
            onClick={() => {
              setSuccess(false);
              setUpc("");
              setName("");
              setBrand("");
              setCategoryId("");
              setRetailPrice("");
            }}
          >
            Submit another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {prefilling && (
        <p className="text-sm text-muted-foreground">Looking up barcode data…</p>
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="upc" className="text-sm font-medium leading-none">
          UPC / Barcode *
        </label>
        <input
          id="upc"
          type="text"
          inputMode="numeric"
          placeholder="012345678901"
          value={upc}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUpc(e.target.value)}
          required
          disabled={submitting}
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground">8–14 digit barcode number</p>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-sm font-medium leading-none">
          Product name *
        </label>
        <input
          id="name"
          type="text"
          placeholder="e.g. Heinz Tomato Ketchup 20oz"
          value={name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
          required
          disabled={submitting}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="brand" className="text-sm font-medium leading-none">
          Brand
        </label>
        <input
          id="brand"
          type="text"
          placeholder="e.g. Heinz"
          value={brand}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBrand(e.target.value)}
          disabled={submitting}
          className={inputClass}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="category" className="text-sm font-medium leading-none">
          Category *
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategoryId(e.target.value)}
          required
          disabled={submitting}
          className={inputClass}
        >
          <option value="">Select a category…</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="retail-price" className="text-sm font-medium leading-none">
          Retail price (USD, optional)
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">$</span>
          <input
            id="retail-price"
            type="number"
            min="0"
            step="0.01"
            placeholder="9.99"
            value={retailPrice}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRetailPrice(e.target.value)}
            className={`${inputClass} pl-6`}
            disabled={submitting}
          />
        </div>
        <p className="text-xs text-muted-foreground">Helps us calculate markup percentage</p>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit product"}
      </Button>
    </form>
  );
}
