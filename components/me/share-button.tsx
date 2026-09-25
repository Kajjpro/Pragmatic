"use client";

import { useState } from "react";

// Web Share API байвал түүгээр, үгүй бол линкийг хуулна.
export function ShareButton({
  url,
  text,
  className,
  children,
}: {
  url: string;
  text: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const full = typeof window !== "undefined" ? new URL(url, window.location.origin).href : url;
    // 1. Утсан дээр — системийн хуваалцах цонх
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Хариу", text, url: full });
        return;
      } catch {
        // Хэрэглэгч болиулсан эсвэл дэмжихгүй — доорх хуулах руу шилжинэ
      }
    }
    // 2. Компьютер дээр — линкийг санах ойд хуулна
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={share} className={className}>
      {copied ? "✓ Линк хуулагдлаа" : children}
    </button>
  );
}
