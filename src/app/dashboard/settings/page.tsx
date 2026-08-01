import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { getAlertSettings } from "@/services/AlertService";
import { DeleteAccountButton } from "@/components/molecules/DeleteAccountButton";
import { AlertSettingsForm } from "@/components/molecules/AlertSettingsForm";

export const metadata: Metadata = {
  title: "Account Settings — TruePrice",
  description: "Manage your TruePrice account settings.",
};

export default async function SettingsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?next=/dashboard/settings");
  }

  const userPrefs = await getAlertSettings(session.user.id);

  return (
    <main className="flex flex-col min-h-screen px-4 py-10 max-w-2xl mx-auto w-full gap-8">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:text-foreground"
          aria-label="Back to dashboard"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">Account Settings</h1>
      </div>

      {/* Account info */}
      <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
        <h2 className="font-semibold">Account</h2>
        <dl className="flex flex-col gap-3 text-sm">
          {session.user.name && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{session.user.name}</dd>
            </div>
          )}
          {session.user.email && (
            <div className="flex flex-col gap-0.5">
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium">{session.user.email}</dd>
            </div>
          )}
        </dl>

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="inline-flex items-center rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition"
          >
            Sign out
          </button>
        </form>
      </section>

      {/* Price alert settings */}
      <AlertSettingsForm
        initialThresholdPct={userPrefs?.alertThresholdPct ?? null}
        initialAlertsEnabled={userPrefs?.alertsEnabled ?? true}
      />

      {/* Danger zone */}
      <section className="flex flex-col gap-4 rounded-lg border border-destructive/40 bg-destructive/5 p-6">
        <h2 className="font-semibold text-destructive">Danger zone</h2>
        <p className="text-sm text-muted-foreground">
          Deleting your account permanently removes your profile, saved products,
          and recently-viewed history. This cannot be undone.
        </p>
        <DeleteAccountButton />
      </section>
    </main>
  );
}
