"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { SubmissionRow } from "@/services/SubmissionService";

interface Props {
  initialSubmissions: SubmissionRow[];
}

export function SubmissionsClient({ initialSubmissions }: Props) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove(id: string) {
    setProcessing(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}/approve`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to approve submission.");
        return;
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(id: string) {
    const reason = prompt("Rejection reason (optional):") ?? undefined;
    setProcessing(id);
    setError(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to reject submission.");
        return;
      }
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No pending submissions.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {submissions.map((sub) => (
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
            <span className="text-xs rounded-full bg-yellow-100 text-yellow-800 px-2 py-0.5 font-medium shrink-0">
              PENDING
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">UPC</dt>
            <dd className="font-mono">{sub.upc}</dd>
            <dt className="text-muted-foreground">Category</dt>
            <dd>{sub.category.name}</dd>
            {sub.retailPriceCents != null && (
              <>
                <dt className="text-muted-foreground">Retail price</dt>
                <dd>${(sub.retailPriceCents / 100).toFixed(2)}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Submitted by</dt>
            <dd>{sub.submittedBy.email ?? sub.submittedBy.name ?? sub.submittedById}</dd>
            <dt className="text-muted-foreground">Submitted at</dt>
            <dd>{new Date(sub.createdAt).toLocaleString()}</dd>
          </dl>

          <div className="flex gap-2 pt-1">
            <Button
              size="sm"
              onClick={() => handleApprove(sub.id)}
              disabled={processing === sub.id}
            >
              {processing === sub.id ? "Processing…" : "Approve"}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleReject(sub.id)}
              disabled={processing === sub.id}
            >
              Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
