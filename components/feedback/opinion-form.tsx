"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const stances = [
  { key: "support", label: "Дэмжих", tone: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  { key: "oppose", label: "Эсэргүүцэх", tone: "bg-rose-100 text-rose-800 ring-rose-200" },
  { key: "neutral", label: "Саармаг", tone: "bg-ink-100 text-ink-700 ring-ink-200" },
] as const;

export function OpinionForm({ clauseNumber }: { clauseNumber?: string }) {
  const [stance, setStance] = useState<typeof stances[number]["key"] | null>(
    null,
  );
  const [text, setText] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!stance) return;
        setSent(true);
        setTimeout(() => setSent(false), 2200);
        setText("");
        setStance(null);
      }}
      className="rounded-xl border border-ink-100 bg-white p-3"
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11.5px] font-semibold text-ink-900">
          {clauseNumber ? `${clauseNumber} — Санал үлдээх` : "Санал үлдээх"}
        </div>
        {sent ? (
          <span className="text-[10.5px] font-semibold text-emerald-700">
            ✓ Илгээгдлээ
          </span>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {stances.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setStance(s.key)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset transition",
              stance === s.key
                ? s.tone + " shadow-[0_4px_12px_-6px_rgba(0,0,0,0.25)]"
                : "bg-white text-ink-500 ring-ink-100 hover:text-ink-900",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Санал, шалтгаанаа бичнэ үү..."
        rows={3}
        className="mt-3 w-full resize-none rounded-lg border border-ink-100 bg-parliament-50/40 px-3 py-2 text-[12.5px] outline-none transition placeholder:text-ink-500/70 focus:border-parliament-500 focus:bg-white"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10.5px] text-ink-500">
          Таны санал тухайн заалтын хариуцагч комисст очно
        </span>
        <button
          type="submit"
          disabled={!stance}
          className={cn(
            "rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition",
            stance
              ? "bg-parliament-800 text-white hover:bg-parliament-700"
              : "cursor-not-allowed bg-ink-100 text-ink-500",
          )}
        >
          Илгээх
        </button>
      </div>
    </form>
  );
}
