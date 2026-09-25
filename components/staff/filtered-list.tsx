"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { filterStatusLabels } from "@/lib/labels";
import type { FilteredCommentView } from "@/lib/law/queries";
import { cn } from "@/lib/cn";

// AI-аар шүүгдсэн саналууд. ХЭЗЭЭ Ч устгадаггүй — зөвхөн шошго тавьдаг.
// Ажилтан «Буцаах» дарвал дараагийн бүлэглэлтэд оролцоно.
export function FilteredList({
  clauseNumber,
  items,
  onRestored,
}: {
  clauseNumber: string;
  items: FilteredCommentView[];
  onRestored: (message: string) => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string[]>([]);

  if (items.length === 0) return null;

  async function restore(id: string) {
    setBusy(id);
    try {
      const res = await fetch(`/api/comments/${id}/restore`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        onRestored(data?.error ?? "Буцаахад алдаа гарлаа");
        return;
      }
      setDone((d) => [...d, id]);
      onRestored("Санал буцаагдлаа — дараагийн бүлэглэлтэд орно");
      router.refresh();
    } catch {
      onRestored("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-2xl border border-ink-200 bg-ink-50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="press flex min-h-14 w-full items-center gap-3 px-4 text-left"
      >
        <span
          aria-hidden
          className={cn(
            "text-[16px] text-ink-600 transition-transform",
            open && "rotate-90",
          )}
        >
          ▸
        </span>
        <span className="text-[16px] font-extrabold text-ink-900">
          Шүүгдсэн ({items.length})
        </span>
        <span className="ml-auto text-[14px] font-semibold text-ink-600">
          {clauseNumber}
        </span>
      </button>

      {open ? (
        <ul className="flex flex-col gap-2.5 px-4 pb-4">
          {items.map((c) => {
            const restored = done.includes(c.id);
            return (
              <li
                key={c.id}
                className="rounded-xl border border-ink-200 bg-white p-3.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-bad-100 px-2.5 py-1 text-[13px] font-bold text-bad-800">
                    {filterStatusLabels[c.filterStatus]}
                  </span>
                  {c.filterReason ? (
                    <span className="text-[14px] text-ink-600">
                      {c.filterReason}
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-[16px] leading-relaxed text-ink-900">
                  {c.text}
                </p>

                <div className="mt-2.5 flex justify-end">
                  {restored ? (
                    <span className="text-[14px] font-bold text-ok-800">
                      ✓ Буцаагдсан
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => restore(c.id)}
                      disabled={busy === c.id}
                      className="press min-h-11 rounded-xl border-2 border-ink-200 bg-white px-4 text-[15px] font-bold text-ink-900 hover:border-brand-400 hover:text-brand-700 disabled:opacity-60"
                    >
                      {busy === c.id ? "Буцааж байна…" : "Буцаах"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
