"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const options = [
  { key: "done", label: "Хийгдсэн", tone: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  { key: "partial", label: "Хагас", tone: "bg-amber-100 text-amber-800 ring-amber-200" },
  { key: "missing", label: "Хийгдээгүй", tone: "bg-rose-100 text-rose-800 ring-rose-200" },
] as const;

export function EvidenceForm() {
  const [choice, setChoice] = useState<typeof options[number]["key"] | null>(
    null,
  );
  const [text, setText] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!choice) return;
        setSent(true);
        setTimeout(() => setSent(false), 2200);
        setChoice(null);
        setText("");
        setImage(null);
      }}
      className="rounded-2xl border border-ink-100 bg-white p-4"
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-ink-900">Нотолгоо илгээх</h4>
        {sent ? (
          <span className="text-[11px] font-semibold text-emerald-700">
            ✓ Илгээгдлээ
          </span>
        ) : null}
      </div>
      <p className="mt-0.5 text-[12px] text-ink-500">
        Хэрэгжилтийн талаарх ажиглалтаа хуваалцна уу
      </p>
      <div className="mt-3 flex gap-2">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setChoice(o.key)}
            className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold ring-1 ring-inset transition",
              choice === o.key
                ? o.tone
                : "bg-white text-ink-500 ring-ink-100 hover:text-ink-900",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Хаана, хэзээ, юуг ажигласан талаар товч тайлбар..."
        className="mt-3 w-full resize-none rounded-lg border border-ink-100 bg-parliament-50/40 px-3 py-2 text-[12.5px] outline-none transition placeholder:text-ink-500/70 focus:border-parliament-500 focus:bg-white"
      />
      <label className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-ink-200 bg-parliament-50/40 px-3 py-2.5 text-[12px] text-ink-500 transition hover:border-parliament-400 hover:text-parliament-800">
        <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
          <path d="M4 15V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v10" stroke="currentColor" strokeWidth="1.6" />
          <path d="m4 12 4-4 4 4 2-2 2 2" stroke="currentColor" strokeWidth="1.6" />
        </svg>
        <span>{image ? image : "Зураг оруулах (шаардлагагүй)"}</span>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => setImage(e.target.files?.[0]?.name ?? null)}
        />
      </label>
      <div className="mt-3 flex items-center justify-end">
        <button
          type="submit"
          disabled={!choice}
          className={cn(
            "rounded-full px-4 py-1.5 text-[12px] font-semibold transition",
            choice
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
