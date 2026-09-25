"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { SignInButton, useUser } from "@clerk/nextjs";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchVoteEvents, postPrediction } from "@/components/feed/feed-data";
import { MAX_SUPPORT_GUESS, type VoteEvent } from "@/lib/types";
import { cn } from "@/lib/cn";

// ② Таамаг — GET /api/vote-events, POST /api/vote-events/[id]/predict.
// Бодит тоо зөвхөн сервер REVEALED гэж буцаасан үед харагдана.
export default function PredictPage() {
  const [events, setEvents] = useState<VoteEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchVoteEvents()
      .then((e) => {
        if (!cancelled) setEvents(e);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Татаж чадсангүй");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const reload = useCallback(() => {
    setError(null);
    setEvents(null);
    setReloadKey((k) => k + 1);
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-[28px] font-extrabold tracking-tight text-ink-950 sm:text-[34px]">
          Таамаг
        </h1>
        <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink-600">
          Санал хураалт батлагдах эсэхийг таа. Бодит үр дүн гармагц оноо нэмэгдэнэ.
        </p>
      </header>

      <div className="mt-6">
        {error ? (
          <ErrorState
            description={`${error}. Түр хүлээгээд дахин оролдоно уу.`}
            retry={reload}
          />
        ) : events === null ? (
          <div className="flex flex-col gap-4" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-3xl border border-ink-200 bg-white p-5 shadow-card">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="mt-3 h-7 w-4/5" />
                <Skeleton className="mt-2 h-4 w-3/5" />
                <Skeleton className="mt-5 h-14 w-full rounded-2xl" />
              </div>
            ))}
            <span className="sr-only">Санал хураалтыг ачаалж байна…</span>
          </div>
        ) : events.length === 0 ? (
          <EmptyState
            emoji="🎯"
            title="Одоогоор таамаглах санал хураалт алга"
            description="Санал хураалт товлогдмогц энд гарч ирнэ."
          />
        ) : (
          <div className="flex flex-col gap-5">
            {events.map((e) => (
              <PredictCard key={e.id} event={e} onSaved={reload} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PredictCard({ event, onSaved }: { event: VoteEvent; onSaved: () => void }) {
  const { isSignedIn } = useUser();
  const reduce = useReducedMotion();
  const [willPass, setWillPass] = useState<boolean | null>(null);
  const [support, setSupport] = useState(Math.round(MAX_SUPPORT_GUESS / 2));
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revealed = event.status === "REVEALED";

  async function submit() {
    if (willPass === null) {
      setError("Эхлээд «Батлагдана» эсвэл «Батлагдахгүй» гэж сонгоно уу");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await postPrediction(event.id, willPass, support);
      setSent(true);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Хадгалж чадсангүй");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="rounded-3xl border border-ink-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        {event.isReplay ? (
          <Pill tone="neutral">Өмнө болсон санал хураалт — дахин тоглох</Pill>
        ) : revealed ? (
          <Pill tone="ok">Дүн гарсан</Pill>
        ) : (
          <Pill tone="brand">Нээлттэй</Pill>
        )}
        {typeof event.predictionCount === "number" && event.predictionCount > 0 ? (
          <span className="text-[13px] font-semibold text-ink-600">
            {event.predictionCount.toLocaleString("mn-MN")} хүн таамагласан
          </span>
        ) : null}
      </div>

      <h2 className="mt-3 text-[20px] font-extrabold leading-snug tracking-tight text-ink-950">
        {event.hook}
      </h2>
      <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-600">{event.title}</p>

      {revealed ? (
        // Бүх тоо серверээс — энд хэзээ ч зохиомол тоо бичихгүй
        <div className="mt-4 rounded-2xl bg-ink-50 p-4">
          <p className="text-[17px] font-extrabold text-ink-950">
            {event.passed ? "✅ Батлагдсан" : "❌ Батлагдаагүй"}
          </p>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
            {event.actualSupport !== null ? (
              <div>
                <dt className="text-[12.5px] font-bold uppercase tracking-wide text-ink-600">
                  Дэмжсэн
                </dt>
                <dd className="font-extrabold tabular-nums text-ok-800">
                  {event.actualSupport}
                </dd>
              </div>
            ) : null}
            {event.actualOppose !== null ? (
              <div>
                <dt className="text-[12.5px] font-bold uppercase tracking-wide text-ink-600">
                  Эсрэг
                </dt>
                <dd className="font-extrabold tabular-nums text-bad-800">
                  {event.actualOppose}
                </dd>
              </div>
            ) : null}
            {event.actualTotal !== null ? (
              <div>
                <dt className="text-[12.5px] font-bold uppercase tracking-wide text-ink-600">
                  Нийт
                </dt>
                <dd className="font-extrabold tabular-nums text-ink-900">
                  {event.actualTotal}
                </dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : sent ? (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl bg-ok-50 p-4"
        >
          <p className="text-[15.5px] font-extrabold text-ok-800">
            Таны таамаг: {willPass ? "Батлагдана" : "Батлагдахгүй"} · {support} гишүүн дэмжинэ
          </p>
          <p className="mt-1 text-[14px] font-semibold text-ink-700">
            Бодит санал хураалт болмогц үр дүнг харуулж, оноог тооцно.
          </p>
        </motion.div>
      ) : (
        <div className="mt-5 flex flex-col gap-5">
          <div>
            <h3 className="text-[13px] font-extrabold uppercase tracking-[0.1em] text-ink-600">
              Батлагдах уу?
            </h3>
            <div className="mt-2.5 grid grid-cols-2 gap-2.5">
              {[
                { label: "Батлагдана", value: true },
                { label: "Батлагдахгүй", value: false },
              ].map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => setWillPass(o.value)}
                  aria-pressed={willPass === o.value}
                  disabled={busy}
                  className={cn(
                    "press min-h-14 rounded-2xl border-2 text-[16px] font-extrabold disabled:opacity-60",
                    willPass === o.value
                      ? "border-brand-600 bg-brand-600 text-white shadow-brand"
                      : "border-ink-200 bg-white text-ink-900 hover:border-brand-400 hover:text-brand-700",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              htmlFor={`support-${event.id}`}
              className="text-[13px] font-extrabold uppercase tracking-[0.1em] text-ink-600"
            >
              Хэдэн гишүүн дэмжих вэ?
            </label>
            <div className="mt-2 flex items-center gap-4">
              <input
                id={`support-${event.id}`}
                type="range"
                min={0}
                max={MAX_SUPPORT_GUESS}
                value={support}
                disabled={busy}
                onChange={(ev) => setSupport(Number(ev.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-200 accent-brand-600"
              />
              <span className="w-16 shrink-0 rounded-xl bg-brand-50 py-1.5 text-center text-[17px] font-extrabold tabular-nums text-brand-700">
                {support}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] text-ink-600">
              УИХ-ын нийт {MAX_SUPPORT_GUESS} гишүүнээс
            </p>
          </div>

          {error ? (
            <p role="alert" className="text-[14.5px] font-semibold text-bad-800">
              {error}
            </p>
          ) : null}

          {isSignedIn ? (
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="press min-h-14 w-full rounded-2xl bg-brand-600 text-[16.5px] font-extrabold text-white shadow-brand hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? "Хадгалж байна…" : "Таамаг илгээх"}
            </button>
          ) : (
            // Зочин таамаг хадгалж чадахгүй — үүнийг урьдчилж хэлнэ
            <div className="rounded-2xl bg-ink-50 p-4 text-center">
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
        </div>
      )}
    </article>
  );
}
