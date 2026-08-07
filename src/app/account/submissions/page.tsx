import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { getUserSubmissions } from "@/services/SubmissionService";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "My Submissions — TruePrice",
  description: "Track the products you've submitted to TruePrice.",
};

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending review", className: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Approved", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Rejected", className: "bg-red-100 text-red-800" },
};

export default async function AccountSubmissionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?next=/account/submissions");
  }

  const submissions = await getUserSubmissions(session.user.id);

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-2xl mx-auto w-full gap-8">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition w-fit"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Dashboard
        </Link>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Submissions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Products you&apos;ve submitted for review
          </p>
        </div>
        <Link
          href="/submit-product"
          className="text-sm text-primary underline underline-offset-4"
        >
          Submit another
        </Link>
      </div>

      {submissions.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-12 text-center">
          <p className="text-muted-foreground">You haven&apos;t submitted any products yet.</p>
          <Link
            href="/submit-product"
            className="text-sm text-primary underline underline-offset-4"
          >
            Submit your first product →
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {submissions.map((sub) => {
            const statusInfo = STATUS_LABELS[sub.status] ?? { label: sub.status, className: "bg-muted text-muted-foreground" };
            return (
              <div
                key={sub.id}
                className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-foreground">{sub.name}</p>
                    {sub.brand && (
                      <p className="text-sm text-muted-foreground">{sub.brand}</p>
                    )}
                  </div>
                  <span className={`text-xs rounded-full px-2 py-0.5 font-medium shrink-0 ${statusInfo.className}`}>
                    {statusInfo.label}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted-foreground">UPC</dt>
                  <dd className="font-mono">{sub.upc}</dd>
                  <dt className="text-muted-foreground">Category</dt>
                  <dd>{sub.category.name}</dd>
                  <dt className="text-muted-foreground">Submitted</dt>
                  <dd>{new Date(sub.createdAt).toLocaleDateString()}</dd>
                  {sub.rejectionReason && (
                    <>
                      <dt className="text-muted-foreground">Reason</dt>
                      <dd className="text-destructive">{sub.rejectionReason}</dd>
                    </>
                  )}
                </dl>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
