"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * "Delete account" button with a confirmation dialog.
 * Calls DELETE /api/user and redirects to / on success.
 */
export function DeleteAccountButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error." }));
        setError(body.error ?? "Failed to delete account.");
        setPending(false);
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center rounded-lg border border-destructive bg-background px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 transition"
      >
        Delete account
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl flex flex-col gap-4">
            <h2 id="delete-dialog-title" className="text-lg font-semibold">
              Delete your account?
            </h2>
            <p className="text-sm text-muted-foreground">
              This will permanently remove your profile, saved products, and
              recently-viewed history. This cannot be undone.
            </p>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending}
                className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 transition disabled:opacity-60"
              >
                {pending ? "Deleting…" : "Yes, delete my account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
