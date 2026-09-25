"use client";

import { useState } from "react";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Pill } from "@/components/ui/pill";
import { Button } from "@/components/ui/button";
import { CountUp } from "./count-up";
import { postPrediction } from "@/components/feed/feed-data";
import { voteOutcomeLabel } from "@/lib/labels";
import { MAX_SUPPORT_GUESS, type Prediction, type VoteEvent } from "@/lib/types";
import { cn } from "@/lib/cn";

const dateFormat = new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "long", day: "numeric" });

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

  return (
    <article id={`event-${event.id}`} className="scroll-mt-24 rounded-lg border border-line bg-surface">
      <header className="border-b border-line p-5">
        <div className="flex flex-wrap items-center gap-2">
          {revealed ? <Pill tone="good">Дүн гарсан</Pill> : <Pill tone="action">Нээлттэй</Pill>}
          {event.isReplay ? <Pill>Өмнө болсон санал хураалт</Pill> : null}
          {event.predictionCount ? (
            <span className="text-[13.5px] tabular-nums text-muted">{event.predictionCount.toLocaleString("mn-MN")} хүн таамагласан</span>
          ) : null}
        </div>
        <h2 className="mt-3 text-[21px] font-bold leading-snug">{event.hook}</h2>
        <p className="mt-1 text-[15px] text-muted">{event.title}</p>
      </header>

      <div className="p-5">
        {revealed ? <Result event={event} mine={mine} /> : mine ? <Saved mine={mine} /> : <PredictForm event={event} onSaved={onSaved} />}
      </div>
    </article>
  );
}

// ── Таамаглах: 1) Тийм/Үгүй → 2) хэдэн гишүүн → 3) баталгаажуулах ──
function PredictForm({ event, onSaved }: { event: VoteEvent; onSaved: () => void }) {
  const { isSignedIn } = useUser();
  const [willPass, setWillPass] = useState<boolean | null>(null);
  const [support, setSupport] = useState(64);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (willPass === null) return;
    setSending(true);
    setError(null);
    try {
      await postPrediction(event.id, willPass, support);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Таамгийг хадгалж чадсангүй.");
    } finally {
      setSending(false);
    }
  }

  const clamp = (n: number) => Math.min(MAX_SUPPORT_GUESS, Math.max(0, Math.round(n)));

  return (
    <div className="flex flex-col gap-5">
      <fieldset>
        <legend className="text-[16px] font-semibold text-heading">1. Энэ хууль эцсийн хэлэлцүүлгээр дэмжигдэх үү?</legend>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {(
            [
              [true, "Тийм"],
              [false, "Үгүй"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={willPass === value}
              onClick={() => {
                setWillPass(value);
                if (step === 1) setStep(2);
              }}
              className={cn(
                "min-h-14 rounded-md border text-[18px] font-semibold",
                willPass === value ? "border-primary bg-primary text-on-primary" : "border-line-strong bg-surface text-fg hover:border-primary",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>

      {step >= 2 ? (
        <div>
          <label htmlFor={`support-${event.id}`} className="text-[16px] font-semibold text-heading">
            2. Хэдэн гишүүн дэмжих вэ? (0–{MAX_SUPPORT_GUESS})
          </label>
          <div className="mt-3 flex items-center gap-4">
            <input
              type="range"
              min={0}
              max={MAX_SUPPORT_GUESS}
              value={support}
              onChange={(e) => setSupport(clamp(Number(e.target.value)))}
              aria-label="Дэмжих гишүүдийн тоо"
              className="h-2 flex-1 accent-[var(--primary)]"
            />
            <input
              id={`support-${event.id}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={MAX_SUPPORT_GUESS}
              value={support}
              onChange={(e) => setSupport(clamp(Number(e.target.value)))}
              className="w-20 rounded-md border border-line-strong bg-surface px-2 py-2 text-center text-[17px] tabular-nums focus:border-action focus:outline-none"
            />
          </div>
          {step === 2 ? (
            <Button className="mt-4" onClick={() => setStep(3)} disabled={willPass === null}>
              Үргэлжлүүлэх
            </Button>
          ) : null}
        </div>
      ) : null}

      {step === 3 && willPass !== null ? (
        <div className="rounded-md border border-line bg-surface-2 p-4">
          <p className="text-[15px] text-muted">3. Таамгаа шалгана уу</p>
          <p className="mt-1 text-[17px]">
            Дэмжигдэх эсэх: <b>{willPass ? "Тийм" : "Үгүй"}</b> · Дэмжих гишүүд: <b className="tabular-nums">{support}</b>
          </p>
          {error ? <p className="mt-2 text-[14px] text-bad-fg">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-3">
            {isSignedIn ? (
              <Button onClick={submit} disabled={sending}>
                {sending ? "Хадгалж байна…" : "Таамгаа илгээх"}
              </Button>
            ) : (
              <SignInButton mode="modal">
                <button type="button" className="min-h-11 rounded-lg bg-primary px-5 text-[15px] font-semibold text-on-primary hover:bg-primary-hover">
                  Нэвтэрч таамгаа хадгалах
                </button>
              </SignInButton>
            )}
            <Button variant="secondary" onClick={() => setStep(2)}>
              Засах
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── Таамаг хадгалагдсан, дүн хүлээж буй ──
function Saved({ mine }: { mine: Prediction }) {
  return (
    <p className="text-[15.5px]">
      Таны таамаг хадгалагдсан: <b>{mine.willPass ? "Тийм" : "Үгүй"}</b>, <b className="tabular-nums">{mine.supportGuess}</b> гишүүн дэмжинэ.
      <span className="block text-muted">Бодит дүн гармагц энд харагдаж, оноо тооцогдоно.</span>
    </p>
  );
}

// ── Бодит дүн: тоонууд, таны таамаг, авсан оноо ──
function Result({ event, mine }: { event: VoteEvent; mine: Prediction | undefined }) {
  const support = event.actualSupport ?? 0;
  const oppose = event.actualOppose ?? 0;
  const total = event.actualTotal ?? 0;
  const passed = event.passed === true;

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-line bg-line text-center">
        <div className="bg-surface p-3">
          <dt className="text-[13.5px] text-muted">Дэмжсэн</dt>
          <dd className="font-serif text-[28px] font-bold text-heading">
            <CountUp to={support} />
          </dd>
        </div>
        <div className="bg-surface p-3">
          <dt className="text-[13.5px] text-muted">Татгалзсан</dt>
          <dd className="font-serif text-[28px] font-bold text-heading">
            <CountUp to={oppose} />
          </dd>
        </div>
        <div className="bg-surface p-3">
          <dt className="text-[13.5px] text-muted">Нийт</dt>
          <dd className="font-serif text-[28px] font-bold text-heading">
            <CountUp to={total} />
          </dd>
        </div>
      </dl>
      <p className="text-[16px] font-semibold text-heading">{voteOutcomeLabel(passed)}</p>
      <p className="text-[15px] text-muted">
        Санал өгсөн <span className="tabular-nums">{total}</span> гишүүнээс <span className="tabular-nums">{support}</span> нь дэмжсэн.
        Хэлэлцүүлгийн шат: эцсийн хэлэлцүүлэг.
        {event.revealedAt ? ` Хариу-д дүн нийтэлсэн: ${dateFormat.format(new Date(event.revealedAt))}.` : ""} Эх сурвалж: УИХ-ын санал хураалт.
      </p>
      {mine ? (
        <div className="rounded-md border border-line bg-surface-2 px-4 py-3 text-[15px]">
          Таны таамаг: <b>{mine.willPass ? "Тийм" : "Үгүй"}</b>, <b className="tabular-nums">{mine.supportGuess}</b> гишүүн.{" "}
          <span className="tabular-nums">{mine.points > 0 ? `+${mine.points} оноо авлаа.` : "Энэ удаа оноо аваагүй."}</span>
        </div>
      ) : null}
    </div>
  );
}
