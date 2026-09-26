"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";

// Web Share API байвал түүгээр, үгүй бол холбоосыг хуулна.
export function ShareButton({ url, text, className }: { url: string; text: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const full = new URL(url, window.location.origin).href;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Parlagmatic", text, url: full });
        return;
      } catch {
        // Хэрэглэгч болиулсан — доорх хуулах руу шилжинэ
      }
    }
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={share} className={className}>
      <Share2 aria-hidden className="h-4 w-4" />
      <span aria-live="polite">{copied ? "Холбоос хуулагдлаа" : "Хуваалцах"}</span>
    </button>
  );
}
