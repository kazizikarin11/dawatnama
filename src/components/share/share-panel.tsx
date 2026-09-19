"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/utils/cn";
import {
  canNativeShare,
  copyToClipboard,
  nativeShare,
  shareMessage,
  whatsappShareUrl,
} from "@/lib/share";

/**
 * Sharing: copy, WhatsApp, the native mobile sheet, and a QR code for printed
 * cards. The QR is rendered in the browser so no server round trip or paid
 * service is involved.
 */

export function SharePanel({
  url,
  names,
  date,
  className,
  tone = "platform",
}: {
  url: string;
  names: string;
  date: string | null;
  className?: string;
  /** `platform` uses the dashboard palette; `template` reads `--t-*` tokens. */
  tone?: "platform" | "template";
}) {
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [qrVisible, setQrVisible] = useState(false);
  const message = shareMessage(names, date);

  useEffect(() => {
    if (!qrVisible || qr) return;
    let active = true;

    QRCode.toDataURL(url, {
      margin: 1,
      width: 512,
      errorCorrectionLevel: "M",
      color: { dark: "#16150f", light: "#fffdf9" },
    })
      .then((value) => {
        if (active) setQr(value);
      })
      .catch(() => {
        if (active) setQr(null);
      });

    return () => {
      active = false;
    };
  }, [qrVisible, qr, url]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2200);
    return () => clearTimeout(timer);
  }, [copied]);

  const buttonClass =
    tone === "platform"
      ? "border-line bg-paper text-ink hover:border-line-strong hover:bg-bone"
      : "border-[var(--t-line)] bg-[color-mix(in_oklab,var(--t-surface)_60%,transparent)] text-[var(--t-ink)] hover:border-[var(--t-accent)]";

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => setCopied(await copyToClipboard(url))}
          className={cn(
            "tap-target border px-5 text-fluid-xs tracking-label-tight transition-colors",
            buttonClass,
          )}
        >
          {copied ? "Link copied" : "Copy link"}
        </button>

        <a
          href={whatsappShareUrl(url, message)}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "tap-target grid place-items-center border px-5 text-fluid-xs tracking-label-tight transition-colors",
            buttonClass,
          )}
        >
          WhatsApp
        </a>

        {canNativeShare() && (
          <button
            type="button"
            onClick={() => void nativeShare({ title: names, text: message, url })}
            className={cn(
              "tap-target border px-5 text-fluid-xs tracking-label-tight transition-colors",
              buttonClass,
            )}
          >
            Share…
          </button>
        )}

        <button
          type="button"
          onClick={() => setQrVisible((value) => !value)}
          aria-expanded={qrVisible}
          className={cn(
            "tap-target border px-5 text-fluid-xs tracking-label-tight transition-colors",
            buttonClass,
          )}
        >
          {qrVisible ? "Hide QR" : "QR code"}
        </button>
      </div>

      <p
        className={cn(
          "truncate text-fluid-xs",
          tone === "platform" ? "text-ink-muted" : "text-[var(--t-ink-muted)]",
        )}
      >
        {url}
      </p>

      {qrVisible && (
        <div className="flex items-center gap-4">
          {qr ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qr}
                alt={`QR code linking to the invitation for ${names}`}
                width={144}
                height={144}
                className="size-36 border border-line bg-paper p-2"
              />
              <a
                href={qr}
                download={`invitation-qr.png`}
                className={cn(
                  "tap-target inline-grid place-items-center border px-5 text-fluid-xs tracking-label-tight",
                  buttonClass,
                )}
              >
                Download
              </a>
            </>
          ) : (
            <p className="text-fluid-xs text-ink-muted">Preparing QR code…</p>
          )}
        </div>
      )}
    </div>
  );
}
