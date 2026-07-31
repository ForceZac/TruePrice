"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  onError?: (error: string) => void;
}

type ScannerState = "idle" | "requesting" | "scanning" | "error" | "denied";

/**
 * BarcodeScanner — client component that opens the rear camera and scans barcodes.
 *
 * Uses html5-qrcode. Loaded dynamically to avoid SSR issues.
 * On permission denial, shows a manual entry fallback link.
 */
export function BarcodeScanner({ onScan, onError }: BarcodeScannerProps) {
  const [state, setState] = useState<ScannerState>("idle");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const scannerRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setState("requesting");
    startScanner();

    return () => {
      scannerRef.current?.stop().catch(() => null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startScanner() {
    // Dynamic import to avoid SSR errors
    let Html5Qrcode: typeof import("html5-qrcode")["Html5Qrcode"];
    let Html5QrcodeSupportedFormats: typeof import("html5-qrcode")["Html5QrcodeSupportedFormats"];
    try {
      ({ Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode"));
    } catch {
      handleError("Failed to load barcode scanner library.");
      return;
    }

    if (!containerRef.current) return;

    const scannerId = "qr-scanner-container";
    containerRef.current.id = scannerId;

    const scanner = new Html5Qrcode(scannerId);
    scannerRef.current = scanner;

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 150 },
      formatsToSupport: [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
      ],
    };

    try {
      await scanner.start(
        { facingMode: "environment" }, // rear camera
        config,
        (decodedText) => {
          onScan(decodedText);
          scanner.stop().catch(() => null);
        },
        () => {
          // scan failure is normal — ignore
        }
      );
      setState("scanning");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("permission") || msg.toLowerCase().includes("denied")) {
        setState("denied");
      } else {
        handleError(msg);
      }
    }
  }

  function handleError(msg: string) {
    setState("error");
    setErrorMsg(msg);
    onError?.(msg);
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      {/* Camera viewport */}
      <div
        ref={containerRef}
        className="w-full aspect-video rounded-xl overflow-hidden bg-muted border border-border relative"
      >
        {state === "requesting" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground animate-pulse">
              Requesting camera access…
            </p>
          </div>
        )}
        {state === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Starting scanner…</p>
          </div>
        )}
      </div>

      {/* Scanning hint */}
      {state === "scanning" && (
        <p className="text-sm text-muted-foreground text-center">
          Point the camera at a barcode — it will scan automatically.
        </p>
      )}

      {/* Permission denied */}
      {state === "denied" && (
        <div className="flex flex-col items-center gap-2 text-center p-4 rounded-lg bg-muted">
          <p className="text-sm font-medium text-foreground">Camera access denied</p>
          <p className="text-sm text-muted-foreground">
            Allow camera access in your browser settings, or type the barcode instead.
          </p>
          <Link
            href="/search"
            className="text-sm text-primary underline underline-offset-4 mt-1"
          >
            Type it instead →
          </Link>
        </div>
      )}

      {/* Generic error */}
      {state === "error" && (
        <div className="flex flex-col items-center gap-2 text-center p-4 rounded-lg bg-destructive/10">
          <p className="text-sm font-medium text-destructive">
            Scanner error
          </p>
          <p className="text-xs text-muted-foreground">{errorMsg}</p>
          <Link
            href="/search"
            className="text-sm text-primary underline underline-offset-4 mt-1"
          >
            Search manually →
          </Link>
        </div>
      )}

      {/* Manual fallback always visible */}
      {state === "scanning" && (
        <Link
          href="/search"
          className="text-xs text-muted-foreground underline underline-offset-4"
        >
          Type it instead
        </Link>
      )}
    </div>
  );
}
