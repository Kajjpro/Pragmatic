"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "./button";

// Алдааны төлөв: энгийн тайлбар + "Дахин оролдох".
export function ErrorState({
  title = "Мэдээллийг ачаалж чадсангүй",
  description = "Түр хүлээгээд дахин оролдоно уу.",
  retry,
}: {
  title?: string;
  description?: string;
  retry?: () => void;
}) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-lg border border-line bg-surface px-6 py-10 text-center">
      <AlertCircle aria-hidden className="h-8 w-8 text-bad-fg" strokeWidth={1.5} />
      <h3 className="mt-3 text-[18px] font-bold">{title}</h3>
      <p className="mt-1.5 max-w-md text-[15px] text-muted">{description}</p>
      {retry ? (
        <Button variant="secondary" size="sm" onClick={retry} className="mt-5">
          Дахин оролдох
        </Button>
      ) : null}
    </div>
  );
}
