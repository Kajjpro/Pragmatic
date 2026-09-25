"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Pill } from "@/components/ui/pill";
import { PointsPop } from "@/components/ui/points-pop";
import { CountUp } from "./count-up";
import { postPrediction } from "@/components/feed/feed-data";
import { MAX_SUPPORT_GUESS, type Prediction, type VoteEvent } from "@/lib/types";
import { cn } from "@/lib/cn";

// ② Таамаг — нэг санал хураалтын карт.
// Төвийг сахисан хэллэг: гишүүн, намын нэр дурдахгүй; зөвхөн батлагдсан эсэх, тоо.
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
    <article className="overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-card">
      <div className="p-5">
        <div className="flex flex-wrap items-center gap-2">
          {revealed ? (
            <Pill tone="ok">Дүн гарсан</Pill>
          ) : (
            <Pill tone="brand">Нээлттэй</Pill>
          )}
          {/* Дахин тоглож буй бол ЗААВАЛ тод тэмдэглэнэ */}
          {event.isReplay ? (
            <Pill tone="neutral">Өмнө болсон санал хураалт — дахин тоглох</Pill>
          ) : null}
          {typeof event.predictionCount === "number" && event.predictionCount > 0 ? (
            <span className="text-[13px] font-semibold text-ink-600">
              {event.predictionCount.toLocaleString("mn-MN")} хүн таамагласан
            </span>
          ) : null}
        </div>

        <h2 className="mt-3 text-[21px] font-extrabold leading-snug tracking-tight text-ink-950">
          {event.hook}
        </h2>
        <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-600">{event.title}</p>
      </div>

      {revealed ? (
        <Reveal event={event} mine={mine} />
      ) : mine ? (
        <Saved mine={mine} />
      ) : (
        <PredictFlow event={event} onSaved={onSaved} />
      )}
    </article>
  );
}

// ── Дүн гарсан: 0-оос бодит тоо хүртэл тоолно ──────────────────────
function Reveal({ event, mine }: { event: VoteEvent; mine: Prediction | undefined }) {
  const reduce = useReducedMotion();
  const [phase, setPhase] = useState<"counting" | "done">("counting");
  const [pop, setPop] = useState(false);

  const support = event.actualSupport ?? 0;
  const earned = mine?.points ?? 0;

  // Тоолол дуусмагц харьцуулалт, дараа нь оноо хөвнө (нийт ≤ 3 сек)
  useEffect(() => {
    const wait = reduce ? 0 : 1700;
    let hide = 0;
    const show = setTimeout(() => {
      setPhase("done");
      if (earned > 0) {
        setPop(true);
        hide = window.setTimeout(() => setPop(false), 1000);
      }
    }, wait);
    return () => {
      clearTimeout(show);
      if (hide) clearTimeout(hide);
    };
  }, [reduce, earned]);

  return (
    <div className="relative border-t border-ink-100 bg-ink-50 p-5">
      <PointsPop points={earned} show={pop} />

      <div className="text-center">
        <p className="text-[12.5px] font-extrabold uppercase tracking-[0.12em] text-ink-600">
          Дэмжсэн гишүүд
        </p>
        <p className="mt-1 font-extrabold tabular-nums leading-none text-brand-700">
          <CountUp to={support} className="text-[64px]" />
          <span className="text-[24px] text-ink-600"> / {MAX_SUPPORT_GUESS}</span>
        </p>
        <p className="mt-2 text-[17px] font-extrabold text-ink-950">
          {event.passed ? "✅ Батлагдсан" : "❌ Батлагдаагүй"}
        </p>
      </div>

      <AnimatePresence>
        {phase === "done" ? (
          <motion.div
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.15 : 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5"
          >
            {mine ? (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <Box label="Чиний таамаг" value={String(mine.supportGuess)} />
                  <Box label="Бодит" value={String(support)} tone="brand" />
                </div>
                <p className="mt-3 text-center text-[15px] font-semibold text-ink-700">
                  Батлагдах эсэх:{" "}
                  <b className={mine.willPass === event.passed ? "text-ok-800" : "text-ink-900"}>
                    {mine.willPass ? "Тийм" : "Үгүй"}
                  </b>{" "}
                  · Бодит:{" "}
                  <b className="text-ink-900">{event.passed ? "Тийм" : "Үгүй"}</b>
                </p>
                {earned > 0 ? (
                  <p className="mt-3 rounded-2xl bg-point-100 p-3 text-center text-[16px] font-extrabold text-point-700">
                    +{earned} оноо
                  </p>
                ) : (
                  <p className="mt-3 text-center text-[14.5px] font-semibold text-ink-600">
                    Энэ удаад оноо нэмэгдсэнгүй. Дараагийнхыг оролдоорой.
                  </p>
                )}
              </>
            ) : (
              <p className="text-center text-[14.5px] font-semibold text-ink-600">
                Та энэ санал хураалтад таамаг өгөөгүй байна.
              </p>
            )}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function Box({ label, value, tone }: { label: string; value: string; tone?: "brand" }) {
  return (
    <div
      className={cn(
        "rounded-2xl p-3 text-center",
        tone === "brand" ? "bg-brand-600 text-white" : "bg-white ring-1 ring-ink-200",
      )}
    >
      <div
        className={cn(
          "text-[12px] font-extrabold uppercase tracking-wide",
          tone === "brand" ? "text-white/80" : "text-ink-600",
        )}
      >
        {label}
      </div>
      <div className="mt-0.5 text-[26px] font-extrabold tabular-nums">{value}</div>
    </div>
  );
}

// ── Таамаг өгсөн, дүн хүлээж байна ────────────────────────────────
function Saved({ mine }: { mine: Prediction }) {
  return (
    <div className="border-t border-ink-100 bg-ok-50 p-5">
      <p className="text-[15.5px] font-extrabold text-ok-800">
        Таамаг чинь хадгалагдлаа. Дүн гарахад мэдэгдэнэ.
      </p>
      <p className="mt-1.5 text-[14.5px] font-semibold text-ink-700">
        Чиний таамаг: {mine.willPass ? "Дэмжигдэнэ" : "Дэмжигдэхгүй"} ·{" "}
        {mine.supportGuess} гишүүн дэмжинэ
      </p>
    </div>
  );
}

// ── 2 алхамт таамаглах урсгал ─────────────────────────────────────
function PredictFlow({ event, onSaved }: { event: VoteEvent; onSaved: () => void }) {
  const { isSignedIn } = useUser();
  const reduce = useReducedMotion();
  const [step, setStep] = useState<1 | 2>(1);
  const [willPass, setWillPass] = useState<boolean | null>(null);
  const [support, setSupport] = useState(Math.round(MAX_SUPPORT_GUESS / 2));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function choose(value: boolean) {
    setWillPass(value);
    setStep(2);
  }

  async function submit() {
    if (willPass === null) return;
    setError(null);
    setBusy(true);
    try {
      await postPrediction(event.id, willPass, support);
      onSaved(); // /api/me-г дахин татна — "хадгалагдлаа" төлөв гарна
    } catch (e) {
      setError(e instanceof Error ? e.message : "Хадгалж чадсангүй");
    } finally {
      setBusy(false);
    }
  }

  const slide = (dir: number) =>
    reduce ? { opacity: 0 } : { opacity: 0, x: dir * 28 };

  return (
    <div className="border-t border-ink-100 p-5">
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="step1"
            initial={slide(1)}
            animate={{ opacity: 1, x: 0 }}
            exit={slide(-1)}
            transition={{ duration: reduce ? 0.15 : 0.22 }}
          >
            <h3 className="text-[13px] font-extrabold uppercase tracking-[0.1em] text-ink-600">
              1/2 · Дэмжигдэх үү?
            </h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => choose(true)}
                className="press min-h-20 rounded-2xl border-2 border-ink-200 bg-white text-[20px] font-extrabold text-ink-900 hover:border-ok-500 hover:bg-ok-50 hover:text-ok-800"
              >
                Тийм
              </button>
              <button
                type="button"
                onClick={() => choose(false)}
                className="press min-h-20 rounded-2xl border-2 border-ink-200 bg-white text-[20px] font-extrabold text-ink-900 hover:border-bad-600 hover:bg-bad-50 hover:text-bad-800"
              >
                Үгүй
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="step2"
            initial={slide(1)}
            animate={{ opacity: 1, x: 0 }}
            exit={slide(-1)}
            transition={{ duration: reduce ? 0.15 : 0.22 }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[13px] font-extrabold uppercase tracking-[0.1em] text-ink-600">
                2/2 · Хэдэн гишүүн дэмжих вэ?
              </h3>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="press text-[13.5px] font-bold text-brand-700 hover:text-brand-800"
              >
                ← Буцах
              </button>
            </div>

            {/* Том тоо */}
            <p className="mt-3 text-center text-[64px] font-extrabold leading-none tabular-nums text-brand-700">
              {support}
              <span className="text-[22px] text-ink-600"> / {MAX_SUPPORT_GUESS}</span>
            </p>

            <label htmlFor={`s-${event.id}`} className="sr-only">
              Хэдэн гишүүн дэмжих вэ?
            </label>
            <input
              id={`s-${event.id}`}
              type="range"
              min={0}
              max={MAX_SUPPORT_GUESS}
              value={support}
              disabled={busy}
              onChange={(e) => setSupport(Number(e.target.value))}
              className="mt-4 h-2.5 w-full cursor-pointer appearance-none rounded-full bg-ink-200 accent-brand-600"
            />
            <p className="mt-1.5 text-center text-[13px] text-ink-600">
              Таны сонголт: {willPass ? "Дэмжигдэнэ" : "Дэмжигдэхгүй"}
            </p>

            {error ? (
              <p role="alert" className="mt-3 text-center text-[14.5px] font-semibold text-bad-800">
                {error}
              </p>
            ) : null}

            {isSignedIn ? (
              <button
                type="button"
                onClick={submit}
                disabled={busy}
                className="press mt-4 min-h-14 w-full rounded-2xl bg-brand-600 text-[16.5px] font-extrabold text-white shadow-brand hover:bg-brand-700 disabled:opacity-60"
              >
                {busy ? "Хадгалж байна…" : "Таамаг илгээх"}
              </button>
            ) : (
              <div className="mt-4 rounded-2xl bg-ink-50 p-4 text-center">
                <p className="text-[14.5px] font-semibold text-ink-700">
                  Таамгаа хадгалж, оноо авахын тулд нэвтэрнэ үү.
                </p>
                <SignInButton mode="modal">
                  <button className="press mt-3 min-h-12 w-full rounded-2xl bg-brand-600 text-[15px] font-extrabold text-white shadow-brand hover:bg-brand-700">
                    Google-ээр нэвтрэх
                  </button>
                </SignInButton>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
