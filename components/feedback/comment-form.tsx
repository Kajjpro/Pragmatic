"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { cn } from "@/lib/cn";

export function CommentForm({
  clauseId,
  isSignedIn,
}: {
  clauseId: string;
  isSignedIn: boolean;
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  if (!isSignedIn) {
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 p-4 text-[14.5px] text-ink-950">
        Санал бичихийн тулд эхлээд нэвтрэх шаардлагатай.{" "}
        <SignInButton mode="modal">
          <button className="press min-h-11 rounded-full bg-point-400 px-4 text-[14px] font-bold text-ink-950 shadow-sm hover:bg-point-300">
            Нэвтрэх
          </button>
        </SignInButton>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setState("sending");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clauseId, body: text.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setState("error");
        setError(data?.error ?? "Илгээхэд алдаа гарлаа");
        return;
      }
      setState("sent");
      setText("");
      router.refresh();
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setError("Сүлжээний алдаа. Дахин оролдоно уу.");
    }
  }

  const disabled = state === "sending" || text.trim().length < 3;

  return (
    <form onSubmit={submit} className="rounded-xl border border-ink-200 bg-brand-50/50 p-4">
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={`comment-${clauseId}`} className="text-[14px] font-bold text-ink-950">
          Санал бичих
        </label>
        {state === "sent" ? (
          <span className="text-[13px] font-bold text-emerald-700">
            ✓ Илгээгдлээ
          </span>
        ) : null}
      </div>
      <textarea
        id={`comment-${clauseId}`}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Санал, шалтгаанаа бичнэ үү…"
        className="w-full resize-none rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-[15px] leading-relaxed text-ink-900 outline-none transition placeholder:text-ink-500 focus:border-brand-500 focus:ring-2 focus:ring-brand-200"
        disabled={state === "sending"}
      />
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <div className="text-[13px] text-ink-600">
          {error ? (
            <span className="font-semibold text-rose-700">{error}</span>
          ) : (
            <>
              {text.length} / 1000 тэмдэгт · Санал бүлэглэгдэж комисст очно
            </>
          )}
        </div>
        <button
          type="submit"
          disabled={disabled}
          className={cn(
            "press min-h-11 shrink-0 rounded-full px-5 text-[14.5px] font-bold",
            disabled
              ? "cursor-not-allowed bg-ink-100 text-ink-600"
              : "bg-point-400 text-ink-950 shadow-[0_6px_18px_-6px_rgba(255,198,7,0.8)] hover:bg-point-300",
          )}
        >
          {state === "sending" ? "Илгээж байна…" : "Санал илгээх"}
        </button>
      </div>
    </form>
  );
}
