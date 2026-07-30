import { Search } from "lucide-react";

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

        <div className="relative w-full mt-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search for a product or scan a barcode..."
            className="w-full rounded-full border border-input bg-background pl-12 pr-6 py-4 text-base shadow-sm outline-none focus:ring-2 focus:ring-ring transition"
            aria-label="Product search"
            disabled
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Full search coming soon. Stay tuned.
        </p>
      </div>
    </main>
  );
}
