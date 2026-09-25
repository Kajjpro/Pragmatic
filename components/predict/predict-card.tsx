"use client";

import { useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Check, Clock, History, Send, X } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { CountUp } from "./count-up";
import { CommunityBar } from "./community-bar";
import { postPrediction } from "@/components/feed/feed-data";
import { voteOutcomeLabel } from "@/lib/labels";
import { MAX_SUPPORT_GUESS, type Prediction, type VoteEvent } from "@/lib/types";
import { POINTS, SUPPORT_GUESS_POINTS } from "@/lib/points-rules";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

// ② Нэг санал хураалтын таамаг. Төвийг сахина: гишүүн, нам, "сайн/муу" дурдахгүй — зөвхөн тоо.
export function PredictCard({
  event,
  mine,
  onSaved,
}: {
  event: VoteEvent;
  mine: Prediction | undefined;
  onSaved: () => void;
}) {
  const revealed = event.status === "REVEALED";
  const total = event.predictionCount ?? 0;

  return (
    <article id={`event-${event.id}`} className="scroll-mt-36 overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      <header className="flex flex-col gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          {revealed ? (
            <Pill tone="good">
              <Check aria-hidden className="h-3.5 w-3.5" /> Дүн гарсан
            </Pill>
          ) : mine ? (
            <Pill tone="warn">
              <Clock aria-hidden className="h-3.5 w-3.5" /> Дүн хүлээгдэж байна
            </Pill>
          ) : (
            <Pill>Таамаг нээлттэй</Pill>
          )}
          {event.isReplay ? (
            <Pill tone="gold">
              <History aria-hidden className="h-3.5 w-3.5" /> Өмнө болсон санал хураалт — дахин тоглох
            </Pill>
          ) : null}
          {!revealed && event.closesAt ? (
            <span className="text-[13px] tabular-nums text-muted">Хаагдах: {formatDate(new Date(event.closesAt))}</span>
          ) : null}
        </div>
        <h2 className="text-[21px] font-bold leading-snug sm:text-[23px]">{event.hook}</h2>
        <p className="text-[14.5px] text-muted">{event.title}</p>
        <CommunityBar yes={event.predictionYes ?? 0} total={total} className="mt-1" />
      </header>

      <div className="border-t border-line bg-page/60 p-5 sm:p-6">
        {revealed ? <Result event={event} mine={mine} /> : mine ? <Saved mine={mine} /> : <PredictForm event={event} onSaved={onSaved} />}
      </div>
    </article>
  );
}

// ── Таамаглах: батлагдах эсэх + дэмжих гишүүдийн тоо → илгээх ──
function PredictForm({ event, onSaved }: { event: VoteEvent; onSaved: () => void }) {
  const { isSignedIn } = useUser();
  const toast = useToast();
  const [willPass, setWillPass] = useState<boolean | null>(null);
  const [support, setSupport] = useState(Math.round(MAX_SUPPORT_GUESS / 2));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (willPass === null) return;
    setSending(true);
    setError(null);
    try {
      await postPrediction(event.id, willPass, support);
      toast("Таамаг хадгалагдлаа. Дүн гармагц оноо бодогдоно.", "ok");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Таамгийг хадгалж чадсангүй.");
    } finally {
      setSending(false);
    }
  }

  const clamp = (n: number) => Math.min(MAX_SUPPORT_GUESS, Math.max(0, Math.round(n)));
  const choices = [
    { value: true, label: "Батлагдана", Icon: Check, on: "border-good bg-good-bg text-good-fg ring-2 ring-good/25" },
    { value: false, label: "Батлагдахгүй", Icon: X, on: "border-bad bg-bad-bg text-bad-fg ring-2 ring-bad/20" },
  ] as const;

  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="text-[15.5px] font-semibold text-heading">1. Эцсийн хэлэлцүүлгээр батлагдах уу?</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {choices.map(({ value, label, Icon, on }) => (
            <button
              key={label}
              type="button"
              aria-pressed={willPass === value}
              onClick={() => setWillPass(value)}
              className={cn(
                "flex min-h-14 items-center justify-center gap-2 rounded-xl border text-[16.5px] font-semibold transition-colors",
                willPass === value ? on : "border-line-strong bg-surface text-fg hover:border-primary",
              )}
            >
              <Icon aria-hidden className="h-5 w-5" /> {label}
            </button>
          ))}
        </div>
      </fieldset>

      <div>
        <div className="flex items-end justify-between gap-3">
          <label htmlFor={`support-${event.id}`} className="text-[15.5px] font-semibold text-heading">
            2. Хэдэн гишүүн дэмжих вэ?
          </label>
          <span className="font-serif text-[30px] font-bold leading-none tabular-nums text-heading">{support}</span>
        </div>
        <input
          id={`support-${event.id}`}
          type="range"
          min={0}
          max={MAX_SUPPORT_GUESS}
          value={support}
          onChange={(e) => setSupport(clamp(Number(e.target.value)))}
          className="mt-3 h-2 w-full cursor-pointer accent-[var(--primary)]"
        />
        <div className="mt-1 flex justify-between text-[12.5px] tabular-nums text-muted" aria-hidden>
          <span>0</span>
          <span>{Math.round(MAX_SUPPORT_GUESS / 2)}</span>
          <span>{MAX_SUPPORT_GUESS} гишүүн</span>
        </div>
        <div className="mt-2 flex gap-2">
          {[-5, -1, 1, 5].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setSupport((s) => clamp(s + d))}
              className="min-h-8 rounded-full border border-line-strong bg-surface px-3 text-[13px] font-semibold tabular-nums hover:border-primary"
            >
              {d > 0 ? `+${d}` : d}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[13.5px] text-muted">
        Батлагдах эсэхийг зөв таавал +{POINTS.PREDICTION_PASS}. Дэмжих гишүүдийн тоо{" "}
        {SUPPORT_GUESS_POINTS.map((t) => `±${t.within} дотор бол +${t.points}`).join(", ")} оноо.
      </p>

      {error ? <p className="text-[14px] text-bad-fg">{error}</p> : null}

      {isSignedIn ? (
        <Button onClick={submit} disabled={sending || willPass === null} size="lg">
          <Send aria-hidden className="h-4 w-4" /> {sending ? "Илгээж байна…" : "Таамаг илгээх"}
        </Button>
      ) : (
        <SignInButton mode="modal">
          <button
            type="button"
            disabled={willPass === null}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-[16px] font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-50"
          >
            <Send aria-hidden className="h-4 w-4" /> Нэвтэрч таамаг илгээх
          </button>
        </SignInButton>
      )}
    </div>
  );
}

// ── Таамаг хадгалагдсан, дүн хүлээж буй ──
function Saved({ mine }: { mine: Prediction }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-bg p-4">
      <Clock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
      <p className="text-[15.5px]">
        Таны таамаг: <b>{mine.willPass ? "Батлагдана" : "Батлагдахгүй"}</b>, <b className="tabular-nums">{mine.supportGuess}</b> гишүүн дэмжинэ.
        <span className="block text-[14px] text-muted">УИХ-ын санал хураалтын дүн ирмэгц оноо автоматаар бодогдоно.</span>
      </p>
    </div>
  );
}

// ── Бодит дүн: тоонууд, таны таамаг, авсан оноо ──
function Result({ event, mine }: { event: VoteEvent; mine: Prediction | undefined }) {
  const support = event.actualSupport ?? 0;
  const oppose = event.actualOppose ?? 0;
  const total = event.actualTotal ?? 0;
  const passed = event.passed === true;
  const supportPct = total > 0 ? (support / total) * 100 : 0;
  const correct = mine ? mine.willPass === passed : null;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={cn("text-[17px] font-bold", passed ? "text-good-fg" : "text-bad-fg")}>{voteOutcomeLabel(passed)}</p>
        <p className="text-[13px] text-muted">
          Эх сурвалж: УИХ-ын санал хураалт{event.revealedAt ? ` · ${formatDate(new Date(event.revealedAt))}` : ""}
        </p>
      </div>
      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-xl border border-line bg-line text-center">
        {(
          [
            ["Дэмжсэн", support, "text-good-fg"],
            ["Татгалзсан", oppose, "text-bad-fg"],
            ["Нийт", total, "text-heading"],
          ] as const
        ).map(([label, value, tone]) => (
          <div key={label} className="bg-surface p-3">
            <dt className="text-[13px] text-muted">{label}</dt>
            <dd className={cn("font-serif text-[28px] font-bold", tone)}>
              <CountUp to={value} />
            </dd>
          </div>
        ))}
      </dl>
      <div className="h-2.5 overflow-hidden rounded-full bg-bad/25" aria-hidden>
        <div className="h-full rounded-full bg-good transition-[width] duration-1000" style={{ width: `${supportPct}%` }} />
      </div>
      {mine ? (
        <div className={cn("flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-[15px]", correct ? "border-good/30 bg-good-bg" : "border-line bg-surface")}>
          <span>
            Таны таамаг: <b>{mine.willPass ? "Батлагдана" : "Батлагдахгүй"}</b>, <b className="tabular-nums">{mine.supportGuess}</b> гишүүн
            {correct ? " — зөв таалаа." : " — энэ удаа таарсангүй."}
          </span>
          <span className={cn("animate-pop rounded-full px-2.5 py-0.5 text-[14px] font-bold tabular-nums", mine.points > 0 ? "bg-gold text-white" : "bg-surface-2 text-muted")}>
            {mine.points > 0 ? `+${mine.points} оноо` : "0 оноо"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
