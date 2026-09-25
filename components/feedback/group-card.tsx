"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { GroupView, Reflection } from "@/lib/mock";
import { ReflectionBadge } from "./reflection-badge";

// live=true бол хариу + Тусгасан/Тусгаагүй-г DB-д хадгална. Демо (mock) бүлэгт false.
export function GroupCard({ group, live = false }: { group: GroupView; live?: boolean }) {
  const [reflection, setReflection] = useState<Reflection>(group.reflection);
  const [text, setText] = useState(group.replyText ?? group.replyDraft ?? "");
  const [saved, setSaved] = useState(Boolean(group.replyText));
  const [error, setError] = useState<string | null>(null);

  async function decide(next: Reflection) {
    setReflection(next);
    setError(null);
    if (live) {
      // Засварласан хариу + шийдвэрийг хадгална → иргэн "Миний санал" хэсэгт харна
      const res = await fetch(`/api/groups/${group.id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText: text, reflection: next }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Хадгалж чадсангүй");
        return;
      }
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <article className="rounded-2xl border border-ink-100 bg-white p-4 shadow-[0_18px_40px_-30px_rgba(15,42,99,0.3)]">
      <header className="flex flex-wrap items-center gap-2">
        <ReflectionBadge value={reflection} />
        <span className="text-[11px] text-ink-500">
          {group.commentCount.toLocaleString("mn-MN")} санал
        </span>
        {saved ? (
          <span className="ml-auto text-[10.5px] font-semibold text-emerald-700">
            ✓ Хадгаллаа
          </span>
        ) : null}
        {error ? (
          <span className="ml-auto text-[10.5px] font-semibold text-rose-700">{error}</span>
        ) : null}
      </header>

      <h4 className="mt-2 text-[13.5px] font-semibold text-ink-900">
        {group.title}
      </h4>
      <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
        {group.summary}
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Комиссын хариу..."
        className="mt-3 w-full resize-none rounded-lg border border-ink-100 bg-parliament-50/40 px-3 py-2 text-[12.5px] leading-relaxed outline-none transition placeholder:text-ink-500/70 focus:border-parliament-500 focus:bg-white"
      />

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[10.5px] text-ink-500">
          AI ноорог засаад Тусгасан/Тусгаагүй сонго
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => decide("NOT_REFLECTED")}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset transition",
              reflection === "NOT_REFLECTED"
                ? "bg-rose-500 text-white ring-rose-500"
                : "bg-white text-rose-700 ring-rose-200 hover:bg-rose-50",
            )}
          >
            Тусгаагүй
          </button>
          <button
            onClick={() => decide("REFLECTED")}
            className={cn(
              "rounded-full px-3.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition",
              reflection === "REFLECTED"
                ? "bg-emerald-500 text-white ring-emerald-500"
                : "bg-white text-emerald-700 ring-emerald-200 hover:bg-emerald-50",
            )}
          >
            Тусгасан
          </button>
        </div>
      </div>
    </article>
  );
}
