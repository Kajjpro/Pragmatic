"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Харилцах цонх (гар утсанд доороос, компьютерт голд). Esc дарж хаана, фокус цонх руу шилжинэ.
// body руу portal-оор гаргана: толгойн backdrop-blur нь fixed элементийг толгой дотор хоригладаг.
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Хаах"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-ink-950/50"
      />
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 max-h-[90dvh] w-full max-w-lg animate-rise overflow-y-auto overscroll-contain rounded-t-lg border border-line bg-surface p-5 shadow-lift outline-none sm:rounded-lg"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-[19px] font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Хаах"
            className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-2"
          >
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
