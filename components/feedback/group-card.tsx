"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { GroupView, ReflectionValue } from "@/lib/law/queries";
import { ReflectionBadge } from "./reflection-badge";

// Ажилтан бүлэг тус бүрд нэг хариу бичиж, «Тусгасан / Тусгаагүй» гэж шийднэ.
// Хариу нь POST /api/groups/[id]/reply-ээр DB-д хадгалагдана.
export function GroupCard({ group }: { group: GroupView }) {
  const router = useRouter();
  const [text, setText] = useState(group.replyText ?? group.replyDraft ?? "");
  const [saving, setSaving] = useState<ReflectionValue | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save(reflection: ReflectionValue) {
    const replyText = text.trim();
    // Хоосон хариу илгээхгүй
    if (replyText.length === 0) {
      setError("Хариуг бичсэний дараа сонгоно уу.");
      return;
    }
    setError(null);
    setSaving(reflection);
    try {
      const res = await fetch(`/api/groups/${group.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText, reflection }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // Сервер монгол текстээр алдаа буцаана
        setError(data?.error ?? "Хадгалахад алдаа гарлаа");
        return;
      }
      router.refresh(); // серверээс шинэчилсэн өгөгдлийг татна
    } catch {
      setError("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setSaving(null);
    }
  }

  const busy = saving !== null;

  return (
    <article className="flex flex-col rounded-2xl border border-ink-200 bg-white p-4 shadow-[0_18px_40px_-30px_rgba(15,42,99,0.3)]">
      <header className="flex flex-wrap items-center gap-2">
        <ReflectionBadge value={group.reflection} />
        <span className="text-[13px] font-semibold text-ink-600">
          {group.commentCount} санал
        </span>
        {group.replyText ? (
          <span className="ml-auto text-[13px] font-bold text-emerald-700">
            ✓ Хадгалсан
          </span>
        ) : null}
      </header>

      <h4 className="mt-2.5 text-[16px] font-bold leading-snug text-ink-900">
        {group.title}
      </h4>
      {group.summary ? (
        <p className="mt-1 text-[14px] leading-relaxed text-ink-700">
          {group.summary}
        </p>
      ) : null}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={5000}
        disabled={busy}
        placeholder="Комиссын хариу…"
        className="mt-3 w-full resize-none rounded-lg border border-ink-200 bg-brand-50/50 px-3.5 py-2.5 text-[14.5px] leading-relaxed text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-200 disabled:opacity-60"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[13px]">
          {error ? (
            <span className="font-semibold text-rose-700">{error}</span>
          ) : (
            <span className="text-ink-600">
              AI ноорог засаад Тусгасан/Тусгаагүй сонго
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => save("NOT_REFLECTED")}
            disabled={busy}
            className={cn(
              "press min-h-11 rounded-full px-4 text-[13.5px] font-bold ring-1 ring-inset disabled:opacity-60",
              group.reflection === "NOT_REFLECTED"
                ? "bg-rose-600 text-white ring-rose-600"
                : "bg-white text-rose-700 ring-rose-300 hover:bg-rose-50",
            )}
          >
            {saving === "NOT_REFLECTED" ? "Хадгалж байна…" : "Тусгаагүй"}
          </button>
          <button
            type="button"
            onClick={() => save("REFLECTED")}
            disabled={busy}
            className={cn(
              "press min-h-11 rounded-full px-4 text-[13.5px] font-bold ring-1 ring-inset disabled:opacity-60",
              group.reflection === "REFLECTED"
                ? "bg-emerald-600 text-white ring-emerald-600"
                : "bg-white text-emerald-700 ring-emerald-300 hover:bg-emerald-50",
            )}
          >
            {saving === "REFLECTED" ? "Хадгалж байна…" : "Тусгасан"}
          </button>
        </div>
      </div>
    </article>
  );
}
