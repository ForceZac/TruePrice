"use client";

import { useState } from "react";
import { VALID_THRESHOLDS } from "@/lib/alert-constants";

interface AlertSettingsFormProps {
  /** Current value from the DB — null means "use 10% default". */
  initialThresholdPct: number | null;
  initialAlertsEnabled: boolean;
}

const THRESHOLD_LABELS: Record<string, string> = {
  null: "10% (default)",
  "0": "Any change",
  "5": "5%",
  "10": "10%",
  "20": "20%",
};

/**
 * Client component rendered inside /dashboard/settings.
 * Submits PATCH /api/account/alert-settings on change.
 */
export function AlertSettingsForm({
  initialThresholdPct,
  initialAlertsEnabled,
}: AlertSettingsFormProps) {
  const [thresholdPct, setThresholdPct] = useState<number | null>(initialThresholdPct);
  const [alertsEnabled, setAlertsEnabled] = useState(initialAlertsEnabled);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save(patch: {
    alertThresholdPct?: number | null;
    alertsEnabled?: boolean;
  }) {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/account/alert-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "Unknown error." }));
        setError(body.error ?? "Failed to save settings.");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleThresholdChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const raw = e.target.value;
    const next = raw === "null" ? null : Number(raw);
    setThresholdPct(next);
    save({ alertThresholdPct: next });
  }

  function handleToggle() {
    const next = !alertsEnabled;
    setAlertsEnabled(next);
    save({ alertsEnabled: next });
  }

  const selectValue = thresholdPct === null ? "null" : String(thresholdPct);

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border bg-card p-6">
      <h2 className="font-semibold">Price Alerts</h2>
      <p className="text-sm text-muted-foreground">
        Get an email when a watched product&apos;s estimated manufacturing cost changes by more
        than your configured threshold.
      </p>

      {/* Alerts enabled toggle */}
      <div className="flex items-center justify-between gap-4">
        <label htmlFor="alerts-enabled" className="text-sm font-medium">
          Email alerts
        </label>
        <button
          id="alerts-enabled"
          type="button"
          role="switch"
          aria-checked={alertsEnabled}
          onClick={handleToggle}
          disabled={saving}
          className={[
            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
            "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            "disabled:opacity-60",
            alertsEnabled ? "bg-primary" : "bg-muted",
          ].join(" ")}
        >
          <span
            className={[
              "inline-block h-4 w-4 rounded-full bg-white shadow transition-transform",
              alertsEnabled ? "translate-x-6" : "translate-x-1",
            ].join(" ")}
          />
          <span className="sr-only">{alertsEnabled ? "Disable" : "Enable"} price alert emails</span>
        </button>
      </div>

      {/* Threshold selector */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="alert-threshold" className="text-sm font-medium">
          Alert threshold
        </label>
        <select
          id="alert-threshold"
          value={selectValue}
          onChange={handleThresholdChange}
          disabled={!alertsEnabled || saving}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="null">{THRESHOLD_LABELS["null"]}</option>
          {VALID_THRESHOLDS.map((v) => (
            <option key={v} value={String(v)}>
              {THRESHOLD_LABELS[String(v)]}
            </option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          Alert fires when the estimated cost moves by at least this amount.
        </p>
      </div>

      {/* Feedback */}
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {saved && (
        <p className="text-sm text-green-600" role="status">
          Saved.
        </p>
      )}
    </section>
  );
}
