import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { getPendingSubmissions } from "@/services/SubmissionService";
import { SubmissionsClient } from "./SubmissionsClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Submission Queue — TruePrice Admin",
  description: "Review and approve user-submitted products.",
};

export default async function AdminSubmissionsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?next=/admin/submissions");
  }

  if (!isAdmin(session.user.email)) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen px-4 text-center gap-4">
        <h1 className="text-2xl font-bold">Access denied</h1>
        <p className="text-muted-foreground">This page is restricted to admins.</p>
        <Link href="/" className="text-sm text-primary underline underline-offset-4">
          Go home
        </Link>
      </main>
    );
  }

  const submissions = await getPendingSubmissions();

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-3xl mx-auto w-full gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Submission Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {submissions.length} pending submission{submissions.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Link
          href="/admin/coverage"
          className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
        >
          Coverage dashboard
        </Link>
      </div>

      <SubmissionsClient initialSubmissions={submissions} />
    </main>
  );
}
