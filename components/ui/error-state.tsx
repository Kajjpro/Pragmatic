"use client";

import { Button } from "./button";

// Алдаа гарсан үеийн төлөв. retry өгвөл "Дахин оролдох" товч гарна.
export function ErrorState({
  title = "Алдаа гарлаа",
  description = "Өгөгдлийг ачаалж чадсангүй. Түр хүлээгээд дахин оролдоно уу.",
  retry,
}: {
  title?: string;
  description?: string;
  retry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-3xl border-2 border-bad-100 bg-bad-50 px-6 py-12 text-center"
    >
      <div className="grid h-14 w-14 place-items-center rounded-full bg-white text-2xl shadow-soft">
        <span aria-hidden>⚠️</span>
      </div>
      <h3 className="mt-4 text-[18px] font-bold text-bad-800">{title}</h3>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-ink-700">
        {description}
      </p>
      {retry ? (
        <Button variant="outline" size="sm" onClick={retry} className="mt-5">
          Дахин оролдох
        </Button>
      ) : null}
    </div>
  );
}
