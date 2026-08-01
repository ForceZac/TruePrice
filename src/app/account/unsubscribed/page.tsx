import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Unsubscribed — TruePrice",
  description: "You've been unsubscribed from TruePrice weekly digest emails.",
};

export default function UnsubscribedPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-6">
      <div className="flex flex-col gap-4 max-w-md">
        <h1 className="text-2xl font-bold tracking-tight">
          You&apos;ve been unsubscribed
        </h1>
        <p className="text-muted-foreground">
          You won&apos;t receive any more weekly digest emails from TruePrice.
        </p>
        <p className="text-sm text-muted-foreground">
          Changed your mind? You can re-enable digests from your{" "}
          <Link
            href="/dashboard/settings"
            className="underline underline-offset-4 hover:text-foreground"
          >
            account settings
          </Link>
          .
        </p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center justify-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition"
        >
          Back to TruePrice
        </Link>
      </div>
    </main>
  );
}
