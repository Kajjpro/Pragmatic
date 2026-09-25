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
    <article className="flex flex-col rounded-2xl border border-ink-100 bg-white p-4 shadow-[0_18px_40px_-30px_rgba(15,42,99,0.3)]">
      <header className="flex flex-wrap items-center gap-2">
        <ReflectionBadge value={group.reflection} />
        <span className="text-[11px] text-ink-500">
          {group.commentCount} санал
        </span>
        {group.replyText ? (
          <span className="ml-auto text-[10.5px] font-semibold text-emerald-700">
            ✓ Хадгалсан
          </span>
        ) : null}
      </header>

      <h4 className="mt-2 text-[13.5px] font-semibold text-ink-900">
        {group.title}
      </h4>
      {group.summary ? (
        <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
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
        className="mt-3 w-full resize-none rounded-lg border border-ink-100 bg-parliament-50/40 px-3 py-2 text-[12.5px] leading-relaxed outline-none transition placeholder:text-ink-500/70 focus:border-parliament-500 focus:bg-white disabled:opacity-60"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10.5px]">
          {error ? (
            <span className="font-semibold text-rose-700">{error}</span>
          ) : (
            <span className="text-ink-500">
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
              "rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset transition disabled:opacity-60",
              group.reflection === "NOT_REFLECTED"
                ? "bg-rose-500 text-white ring-rose-500"
                : "bg-white text-rose-700 ring-rose-200 hover:bg-rose-50",
            )}
          >
            {saving === "NOT_REFLECTED" ? "Хадгалж байна…" : "Тусгаагүй"}
          </button>
          <button
            type="button"
            onClick={() => save("REFLECTED")}
            disabled={busy}
            className={cn(
              "rounded-full px-3.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition disabled:opacity-60",
              group.reflection === "REFLECTED"
                ? "bg-emerald-500 text-white ring-emerald-500"
                : "bg-white text-emerald-700 ring-emerald-200 hover:bg-emerald-50",
            )}
          >
            {saving === "REFLECTED" ? "Хадгалж байна…" : "Тусгасан"}
          </button>
        </div>
      </div>
    </article>
  );
}
