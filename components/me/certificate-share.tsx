"use client";

import { useState } from "react";
import { Check, Download, Link2 } from "lucide-react";
import { buttonClass } from "@/components/ui/button";

// Батламжийг хуваалцах: Facebook, X, холбоос хуулах, зураг татах (OG зураг, 1200×630)
export function CertificateShare({ url, path, text, imagePath }: { url: string; path: string; text: string; imagePath: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const full = new URL(path, window.location.origin).href;
    try {
      await navigator.clipboard.writeText(full);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Холбоосыг хуулна уу:", full);
    }
  }

  const encoded = encodeURIComponent(url);
  const share = [
    { label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encoded}` },
    { label: "X", href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encoded}` },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {share.map((s) => (
        <a key={s.label} href={s.href} target="_blank" rel="noreferrer noopener" className={buttonClass("secondary", "sm", "rounded-full")}>
          {s.label}-т хуваалцах
        </a>
      ))}
      <button type="button" onClick={copy} className={buttonClass("secondary", "sm", "rounded-full")}>
        {copied ? <Check aria-hidden className="h-4 w-4 text-good" /> : <Link2 aria-hidden className="h-4 w-4" />}
        <span aria-live="polite">{copied ? "Хуулагдлаа" : "Холбоос хуулах"}</span>
      </button>
      <a href={imagePath} download="hariu-batlamj.png" className={buttonClass("primary", "sm", "rounded-full")}>
        <Download aria-hidden className="h-4 w-4" /> Зураг татах
      </a>
    </div>
  );
}
