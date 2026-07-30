"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { BarcodeScanner } from "@/components/molecules/BarcodeScanner";
import { useBarcodeLookup } from "@/hooks/useProductLookup";

export default function ScanPage() {
  const router = useRouter();
  const [scanError, setScanError] = useState<string | null>(null);
  const lookup = useBarcodeLookup();

  async function handleScan(barcode: string) {
    setScanError(null);

    const result = await lookup.mutateAsync(barcode).catch((err: Error) => {
      setScanError(err.message ?? "Lookup failed");
      return null;
    });

    if (!result) return;

    if (result.found && result.product) {
      router.push(`/product/${result.product.id}`);
    } else {
      setScanError(`No product found for barcode ${barcode}. Try searching manually.`);
    }
  }

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-md mx-auto w-full gap-6">
      <Link
        href="/search"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition w-fit"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to search
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Scan a barcode
        </h1>
        <p className="text-sm text-muted-foreground">
          Point your camera at a product barcode to look it up.
        </p>
      </div>

      {lookup.isPending ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Looking up product…</p>
        </div>
      ) : (
        <BarcodeScanner onScan={handleScan} onError={setScanError} />
      )}

      {scanError && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {scanError}
        </div>
      )}
    </main>
  );
}
