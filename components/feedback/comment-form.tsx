"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

// Заалтад санал бичих. Унших нь нэвтрэлтгүй; зөвхөн илгээхэд нэвтрэхийг хүснэ.
export function CommentForm({ clauseId, isSignedIn }: { clauseId: string; isSignedIn: boolean }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  if (!isSignedIn) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-surface-2 px-4 py-3 text-[15px]">
        <span className="text-muted">Энэ заалтад санал өгөхийн тулд нэвтэрнэ үү.</span>
        <SignInButton mode="modal">
          <button type="button" className="min-h-9 rounded-md border border-line-strong bg-surface px-3.5 text-[14px] font-semibold hover:border-primary">
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
        body: JSON.stringify({ clauseId, text: text.trim() }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setState("error");
        setError(data?.error ?? "Саналыг илгээж чадсангүй.");
        return;
      }
      setState("sent");
      setText("");
      router.refresh();
    } catch {
      setState("error");
      setError("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.");
    }
  }

  return (
    <form onSubmit={submit} className="rounded-md border border-line bg-surface p-4">
      <label htmlFor={`comment-${clauseId}`} className="text-[15px] font-semibold text-heading">
        Энэ заалтад санал өгөх
      </label>
      <textarea
        id={`comment-${clauseId}`}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (state === "sent") setState("idle");
        }}
        rows={3}
        maxLength={1000}
        placeholder="Саналаа, шалтгаантай нь бичнэ үү."
        disabled={state === "sending"}
        className="mt-2 w-full resize-y rounded-md border border-line-strong bg-surface px-3 py-2.5 text-[15.5px] text-fg placeholder:text-muted focus:border-action focus:outline-none focus:ring-2 focus:ring-action/25"
      />
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[13.5px] text-muted" aria-live="polite">
          {error ? (
            <span className="text-bad-fg">{error}</span>
          ) : state === "sent" ? (
            <span className="text-good-fg">Санал илгээгдлээ. Ажилтан бүлэглэн хариулна.</span>
          ) : (
            `${text.length} / 1000 тэмдэгт. Таны санал устгагдахгүй.`
          )}
        </p>
        <Button type="submit" size="sm" disabled={state === "sending" || text.trim().length < 3}>
          {state === "sending" ? "Илгээж байна…" : "Санал илгээх"}
        </Button>
      </div>
    </form>
  );
}
