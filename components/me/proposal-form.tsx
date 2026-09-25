"use client";

import { useEffect, useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListSkeleton } from "@/components/ui/page-loading";
import { ErrorState } from "@/components/ui/error-state";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { changeTypeLabels } from "@/lib/labels";
import { POINTS } from "@/lib/points-rules";
import { cn } from "@/lib/cn";
import type { CommentTarget } from "@/lib/types";

const MIN = 10;
const MAX = 1000; // POST /api/comments-ийн дээд хязгаар
const VOTES = [
  { value: "SUPPORT", label: "Дэмжинэ" },
  { value: "OPPOSE", label: "Эсэргүүцнэ" },
  { value: "NEUTRAL", label: "Засвар санал болгоно" },
] as const;

// Санал ирүүлэх: төсөл → заалт → санал. POST /api/comments (өмнөх API хэвээр).
// Илгээсэн санал шууд «Миний санал» явцад "Илгээсэн" шатанд гарна.
export function ProposalForm({ onSent }: { onSent: () => void }) {
  const { isSignedIn } = useUser();
  const toast = useToast();
  const [targets, setTargets] = useState<CommentTarget[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [billId, setBillId] = useState("");
  const [clauseId, setClauseId] = useState("");
  const [vote, setVote] = useState<(typeof VOTES)[number]["value"]>("NEUTRAL");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/comment-targets")
      .then(async (r) => {
        if (!r.ok) throw new Error("Төслүүдийг татаж чадсангүй");
        return (await r.json()) as CommentTarget[];
      })
      .then((t) => {
        if (cancelled) return;
        setTargets(t);
        if (t[0]) {
          setBillId(t[0].billId);
          setClauseId(t[0].clauses[0]?.id ?? "");
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) setLoadError(e instanceof Error ? e.message : "Төслүүдийг татаж чадсангүй");
      });
    return () => {
      cancelled = true;
    };
  }, [reload]);

  if (loadError)
    return (
      <ErrorState
        description={`${loadError}. Дахин оролдоно уу.`}
        retry={() => {
          setLoadError(null);
          setReload((k) => k + 1);
        }}
      />
    );
  if (targets === null) return <ListSkeleton rows={1} />;
  if (targets.length === 0)
    return (
      <EmptyState
        title="Одоогоор санал авч буй заалт алга"
        description="Ажлын алба заалтын харьцуулалтыг баталгаажуулж нийтлэхэд энд санал ирүүлэх боломжтой болно."
      />
    );

  const bill = targets.find((t) => t.billId === billId) ?? targets[0];
  const clause = bill.clauses.find((c) => c.id === clauseId) ?? bill.clauses[0];
  const length = text.trim().length;
  const tooShort = length < MIN;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (tooShort || !clause) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clauseId: clause.id, text: text.trim(), vote }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error ?? "Саналыг илгээж чадсангүй.");
        return;
      }
      setText("");
      toast("Санал илгээгдлээ. Явцыг «Миний санал» хэсгээс харна уу.", "ok");
      onSent();
    } catch {
      setError("Сүлжээний алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setSending(false);
    }
  }

  const field = "mt-1.5 w-full rounded-xl border border-line-strong bg-surface px-3.5 py-2.5 text-[15.5px] text-fg focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
      <div className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6">
        <div>
          <label htmlFor="proposal-bill" className="text-[14.5px] font-semibold text-heading">
            Хуулийн төсөл
          </label>
          <select
            id="proposal-bill"
            value={bill.billId}
            onChange={(e) => {
              const next = targets.find((t) => t.billId === e.target.value);
              setBillId(e.target.value);
              setClauseId(next?.clauses[0]?.id ?? "");
            }}
            className={field}
          >
            {targets.map((t) => (
              <option key={t.billId} value={t.billId}>
                {t.billTitle}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="proposal-clause" className="text-[14.5px] font-semibold text-heading">
            Заалт
          </label>
          <select id="proposal-clause" value={clause?.id ?? ""} onChange={(e) => setClauseId(e.target.value)} className={field}>
            {bill.clauses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.number}-р заалт ({changeTypeLabels[c.changeType]})
              </option>
            ))}
          </select>
          {clause?.what ? <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-[14px] text-muted">{clause.what}</p> : null}
        </div>

        <fieldset>
          <legend className="text-[14.5px] font-semibold text-heading">Таны байр суурь</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {VOTES.map((v) => (
              <button
                key={v.value}
                type="button"
                aria-pressed={vote === v.value}
                onClick={() => setVote(v.value)}
                className={cn(
                  "min-h-10 rounded-full border px-4 text-[14px] font-semibold transition-colors",
                  vote === v.value ? "border-primary bg-primary text-on-primary" : "border-line-strong bg-surface hover:border-primary",
                )}
              >
                {v.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="proposal-text" className="text-[14.5px] font-semibold text-heading">
            Санал
          </label>
          <textarea
            id="proposal-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            maxLength={MAX}
            placeholder="Юуг, яагаад өөрчлөхийг санал болгож байгаагаа тодорхой бичнэ үү."
            className={cn(field, "resize-y")}
            aria-describedby="proposal-help"
          />
          <p id="proposal-help" className="mt-1.5 flex justify-between text-[13px] text-muted">
            <span>{tooShort && length > 0 ? `Дор хаяж ${MIN} тэмдэгт бичнэ үү.` : "Таны нэрийн эхний үг л нийтэд харагдана."}</span>
            <span className="tabular-nums">
              {length} / {MAX}
            </span>
          </p>
        </div>

        {error ? <p className="text-[14px] text-bad-fg">{error}</p> : null}

        {isSignedIn ? (
          <Button type="submit" size="lg" disabled={sending || tooShort}>
            <Send aria-hidden className="h-4 w-4" /> {sending ? "Илгээж байна…" : "Санал илгээх"}
          </Button>
        ) : (
          <SignInButton mode="modal">
            <button type="button" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-[16px] font-semibold text-on-primary hover:bg-primary-hover">
              <Send aria-hidden className="h-4 w-4" /> Нэвтэрч санал илгээх
            </button>
          </SignInButton>
        )}
      </div>

      <aside className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 text-[14.5px] lg:self-start">
        <h3 className="font-sans text-[14px] font-semibold text-heading">Таны санал хаашаа явдаг вэ</h3>
        <ol className="flex flex-col gap-3">
          {[
            ["AI шүүлт", "Сэдвээс гадуур, давхардсан саналыг шошглоно. Хэзээ ч устгахгүй."],
            ["AI бүлэглэлт", "Ижил санааг нэг бүлэг болгож ажлын албанд хүргэнэ."],
            ["Ажлын албаны хариу", "Бүлэг бүрт хариулж, тусгасан эсэхийг тэмдэглэнэ."],
            ["Тусгагдсан", `«Хууль өөрчилсөн иргэн» тэмдэг, батламж, +${POINTS.REFLECTED} оноо.`],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface-2 text-[12.5px] font-bold">{i + 1}</span>
              <span>
                <b className="block text-fg">{title}</b>
                <span className="text-muted">{body}</span>
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-1 flex items-start gap-2 rounded-lg bg-good-bg px-3 py-2 text-[13.5px] text-good-fg">
          <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /> Иргэний саналыг хэзээ ч устгадаггүй.
        </p>
      </aside>
    </form>
  );
}
