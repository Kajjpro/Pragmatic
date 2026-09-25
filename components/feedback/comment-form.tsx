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
      <div className="rounded-xl border border-parliament-100 bg-parliament-50/40 p-3 text-[12px] text-parliament-900">
        Санал бичихийн тулд эхлээд нэвтрэх шаардлагатай.{" "}
        <SignInButton mode="modal">
          <button className="ml-1 rounded-full bg-parliament-700 px-3 py-1 text-[11px] font-semibold text-white transition hover:bg-parliament-800">
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
    <form onSubmit={submit} className="rounded-xl border border-ink-100 bg-white p-3">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[11px] font-semibold text-parliament-900">
          Санал бичих
        </label>
        {state === "sent" ? (
          <span className="text-[10.5px] font-semibold text-emerald-700">
            ✓ Илгээгдлээ
          </span>
        ) : null}
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Санал, шалтгаанаа бичнэ үү…"
        className="w-full resize-none rounded-lg border border-ink-100 bg-parliament-50/40 px-3 py-2 text-[13px] outline-none transition placeholder:text-ink-500/70 focus:border-parliament-500 focus:bg-white"
        disabled={state === "sending"}
      />
      <div className="mt-2 flex items-center justify-between">
        <div className="text-[10.5px] text-ink-500">
          {error ? (
            <span className="text-rose-700">{error}</span>
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
            "rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition",
            disabled
              ? "cursor-not-allowed bg-ink-100 text-ink-500"
              : "bg-parliament-700 text-white hover:bg-parliament-800",
          )}
        >
          {state === "sending" ? "Илгээж байна…" : "Санал илгээх"}
        </button>
      </div>
    </form>
  );
}
