"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import type { GroupView, ReflectionValue } from "@/lib/law/queries";
import { ReflectionBadge } from "./reflection-badge";

// Ажилтан бүлэг тус бүрд нэг хариу бичиж, «Тусгасан / Тусгаагүй» гэж шийднэ.
// Хариу нь POST /api/groups/[id]/reply-ээр DB-д хадгалагдана.
export function GroupCard({
  group,
  onSaved,
}: {
  group: GroupView;
  onSaved?: (reflection: ReflectionValue) => void;
}) {
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
      onSaved?.(reflection); // ажлын ширээ мэдэгдэл харуулна
      router.refresh(); // серверээс шинэчилсэн өгөгдлийг татна
    } catch {
      setError("Сүлжээний алдаа. Дахин оролдоно уу.");
    } finally {
      setSaving(null);
    }
  }

  const busy = saving !== null;

  return (
    <article className="flex flex-col rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
      <header className="flex flex-wrap items-center gap-2">
        <ReflectionBadge value={group.reflection} />
        <span className="text-[15px] font-bold text-ink-600">
          {group.commentCount} санал
        </span>
        {group.replyText ? (
          <span className="ml-auto text-[15px] font-bold text-ok-800">
            Хадгалсан
          </span>
        ) : null}
      </header>

      <h4 className="mt-3 text-[19px] font-bold leading-snug text-ink-950">
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
        <div className="text-[15px]">
          {error ? (
            <span className="font-semibold text-bad-600">{error}</span>
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
              "press min-h-14 rounded-2xl px-6 text-[17px] font-bold ring-2 ring-inset disabled:opacity-60",
              group.reflection === "NOT_REFLECTED"
                ? "bg-bad-600 text-white ring-bad-600"
                : "bg-white text-bad-600 ring-bad-600/40 hover:bg-bad-50",
            )}
          >
            {saving === "NOT_REFLECTED" ? "Хадгалж байна…" : "Тусгаагүй"}
          </button>
          <button
            type="button"
            onClick={() => save("REFLECTED")}
            disabled={busy}
            className={cn(
              "press min-h-14 rounded-2xl px-6 text-[17px] font-bold ring-2 ring-inset disabled:opacity-60",
              group.reflection === "REFLECTED"
                ? "bg-ok-700 text-white ring-ok-700"
                : "bg-white text-ok-800 ring-ok-500 hover:bg-ok-50",
            )}
          >
            {saving === "REFLECTED" ? "Хадгалж байна…" : "Тусгасан"}
          </button>
        </div>
      </div>
    </article>
  );
}
