"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface QRCodeViewProps {
  value: string;
  size?: number;
  className?: string;
  /** when true, render a white background for scannability on dark UI */
  light?: boolean;
}

/** Renders a QR code as an inline SVG data URL. Purely client-side
 *  (qrcode lib is sync but we resolve on mount to avoid SSR issues). */
export function QRCodeView({ value, size = 200, className = "", light = true }: QRCodeViewProps) {
  const [dataUrl, setDataUrl] = useState<string>("");
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(value, {
      width: size * 2, // 2x for crispness
      margin: 1,
      errorCorrectionLevel: "M",
      color: light
        ? { dark: "#0a0a0a", light: "#ffffff" }
        : { dark: "#ededed", light: "#00000000" },
    })
      .then((url) => {
        if (active) {
          setDataUrl(url);
          setError(false);
        }
      })
      .catch(() => active && setError(true));
    return () => {
      active = false;
    };
  }, [value, size, light]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg bg-[color-mix(in_oklch,var(--status-down)_14%,transparent)] text-xs text-[var(--status-down)] ${className}`}
        style={{ width: size, height: size }}
      >
        QR failed
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={`animate-pulse rounded-lg bg-surface-2 ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={dataUrl}
      alt="QR code"
      width={size}
      height={size}
      className={className}
      style={{ width: size, height: size }}
    />
  );
}
