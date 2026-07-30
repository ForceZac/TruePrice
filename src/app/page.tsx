import Link from "next/link";
import { ScanLine } from "lucide-react";
import { SearchInput } from "@/components/molecules/SearchInput";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-24">
      <div className="flex flex-col items-center gap-6 text-center max-w-2xl w-full">
        <h1 className="text-5xl font-bold tracking-tight text-foreground">
          TruePrice
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Find out what products actually cost to make — and how much you&apos;re
          paying above that.
        </p>

        <div className="flex items-center gap-3 w-full mt-4">
          <div className="flex-1">
            <SearchInput placeholder="Search for a product or enter a name…" />
          </div>
          <Link
            href="/scan"
            aria-label="Scan barcode"
            className="flex items-center justify-center h-14 w-14 rounded-full border border-input bg-background text-foreground shadow-sm hover:bg-muted transition shrink-0"
          >
            <ScanLine className="h-6 w-6" aria-hidden="true" />
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          Search for any product by name, or scan the barcode to look it up.
        </p>
      </div>
    </main>
  );
}
