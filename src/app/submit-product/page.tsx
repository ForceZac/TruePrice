import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SubmitProductForm } from "./SubmitProductForm";

export const metadata: Metadata = {
  title: "Submit a Product — TruePrice",
  description: "Help grow the TruePrice catalog by submitting a product you couldn't find.",
};

export default async function SubmitProductPage({
  searchParams,
}: {
  searchParams: Promise<{ upc?: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    const { upc } = await searchParams;
    const next = upc ? `/submit-product?upc=${encodeURIComponent(upc)}` : "/submit-product";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  const { upc } = await searchParams;

  const categories = await prisma.productCategory.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-lg mx-auto w-full gap-8">
      <Link
        href="/search"
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition w-fit"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to search
      </Link>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Submit a product
        </h1>
        <p className="text-sm text-muted-foreground">
          Can&apos;t find a product? Help build the catalog. We&apos;ll review your submission and email you when it&apos;s approved.
        </p>
      </div>

      <SubmitProductForm initialUpc={upc ?? ""} categories={categories} />

      <p className="text-xs text-muted-foreground text-center">
        You can track your submissions in your{" "}
        <Link href="/account/submissions" className="underline underline-offset-4 hover:text-foreground">
          account
        </Link>
        .
      </p>
    </main>
  );
}
