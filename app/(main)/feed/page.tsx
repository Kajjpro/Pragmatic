"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { FeedCard, Persona, QuizAnswerResult } from "@/lib/types";
import { personaLabels } from "@/lib/types";
import { fetchFeed, postCardView, postPersona } from "@/components/feed/feed-data";
import { useMe } from "@/components/shell/me-context";
import { readProgress, recordCardView, recordQuizAnswer, writeProgress, type Progress } from "@/components/feed/progress-store";
import { CardReader } from "@/components/feed/card-reader";
import { PersonaSelect } from "@/components/feed/persona-select";
import { Container } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ListSkeleton } from "@/components/ui/page-loading";
import { Button } from "@/components/ui/button";
import { StreakPanel } from "@/components/feed/streak-panel";
import Link from "next/link";
import { CheckCircle2, Circle, Sparkles, Trophy } from "lucide-react";
import { cn } from "@/lib/cn";
import { POINTS } from "@/lib/points-rules";

// ① Өнөөдрийн хууль. Өгөгдөл: GET /api/feed (DB-ээс, AI дуудахгүй).
// Оноо, дараалсан өдөр: нэвтэрсэн бол сервер эрх мэдэлтэй; зочин бол төхөөрөмж дээр.
export default function FeedPage() {
  const { isSignedIn } = useUser();
  const { me, patch } = useMe();

  const [progress, setProgress] = useState<Progress | null>(null);
  const [override, setOverride] = useState<{ points: number; streak: number } | null>(null);
  const [picked, setPicked] = useState<Persona | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [loaded, setLoaded] = useState<{ persona: Persona; cards: FeedCard[] } | null>(null);
  const [failed, setFailed] = useState<{ persona: Persona; message: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [index, setIndex] = useState(0);
  const [gain, setGain] = useState(0); // сүүлд нэмэгдсэн оноо ("+3 оноо")
  const progressRef = useRef<Progress | null>(null);
  const meRef = useRef(me);
  useEffect(() => {
    meRef.current = me;
  }, [me]);
  const gainTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Төхөөрөмж дээрх явцыг уншина
  useEffect(() => {
    const p = readProgress();
    progressRef.current = p;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage-г зөвхөн хөтөч дээр уншина
    setProgress(p);
  }, []);

  // Идэвхтэй сонголт: энэ удаад сонгосон → сервер → төхөөрөмж
  const stored = me?.persona ?? progress?.persona ?? null;
  const persona: Persona | null = picked ?? stored;
  // Анх ирсэн зочноос л асууна
  const needsChoice = choosing || (progress !== null && !isSignedIn && progress.persona === null && picked === null);

  // 2. Сонголтоор картуудыг татна
  useEffect(() => {
    if (persona === null && progress === null) return;
    const p = persona ?? "ALL";
    let cancelled = false;
    fetchFeed(p)
      .then((cards) => {
        if (cancelled) return;
        setLoaded({ persona: p, cards });
        setIndex(0);
      })
      .catch((e: unknown) => {
        if (!cancelled) setFailed({ persona: p, message: e instanceof Error ? e.message : "Картуудыг ачаалж чадсангүй" });
      });
    return () => {
      cancelled = true;
    };
  }, [persona, progress, reloadKey]);

  const active = persona ?? "ALL";
  const cards = loaded && loaded.persona === active ? loaded.cards : null;
  const error = failed && failed.persona === active ? failed : null;

  const showGain = useCallback((n: number) => {
    if (n <= 0) return;
    setGain(n);
    if (gainTimer.current) clearTimeout(gainTimer.current);
    gainTimer.current = setTimeout(() => setGain(0), 3000);
  }, []);

  const pickPersona = useCallback(
    (choice: Persona) => {
      setChoosing(false);
      setPicked(choice);
      const next = { ...(progressRef.current ?? readProgress()), persona: choice };
      progressRef.current = next;
      writeProgress(next);
      setProgress(next);
      if (isSignedIn) postPersona(choice);
    },
    [isSignedIn],
  );

  // 3. Карт үзсэн
  const onCardViewed = useCallback(
    async (card: FeedCard) => {
      const result = await postCardView(card.id);
      if (result?.saved) {
        setOverride({ points: result.points ?? 0, streak: result.streak ?? 0 });
        // Толгойн оноо, streak-ийг шууд шинэчилнэ (/api/me-г дахин татахгүй)
        patch({
          points: result.points ?? 0,
          streak: result.streak ?? 0,
          activeToday: true,
          viewedCardIdsToday: Array.from(new Set([...(meRef.current?.viewedCardIdsToday ?? []), card.id])),
        });
        showGain(result.pointsAwarded);
        return;
      }
      const p = progressRef.current;
      if (!p) return;
      const { next, gained } = recordCardView(p, card.id);
      progressRef.current = next;
      setProgress(next);
      showGain(gained);
    },
    [showGain, patch],
  );

  // 4. Асуултад хариулсан
  const onAnswered = useCallback(
    (questionId: string, result: QuizAnswerResult) => {
      if (result.saved) {
        setOverride((s) => ({ points: result.points ?? s?.points ?? 0, streak: s?.streak ?? 0 }));
        if (typeof result.points === "number") patch({ points: result.points });
        showGain(result.pointsAwarded);
        return;
      }
      const p = progressRef.current;
      if (!p || !result.correct) return;
      // Тэр картын асуултад анх зөв хариулж байгаа бол картыг уншсаны оноо нэмнэ
      const card = loaded?.cards.find((c) => c.quiz.some((q) => q.id === questionId));
      const firstOnCard = !card?.quiz.some((q) => q.id !== questionId && p.answered.includes(q.id));
      const { next, gained } = recordQuizAnswer(p, questionId, POINTS.QUIZ_CORRECT + (firstOnCard ? POINTS.CARD_VIEW : 0));
      progressRef.current = next;
      setProgress(next);
      showGain(gained);
    },
    [showGain, patch, loaded],
  );

  const points = override?.points ?? me?.points ?? progress?.points ?? 0;
  const streak = override?.streak ?? me?.streak ?? progress?.streak ?? 0;

  const viewedIds = me ? (me.viewedCardIdsToday ?? []) : (progress?.viewedToday ?? []);

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-gold-fg">60 секундэд нэг хууль</p>
          <h1 className="mt-1 text-[30px] font-bold sm:text-[34px]">Өнөөдрийн хууль</h1>
          <p className="mt-1 max-w-xl text-[15.5px] text-muted">
            Өмнө нь ямар байсан, ямар болох, чамд юу хамаатайг гурван алхамаар.
          </p>
          <Link href="/leaderboard?tab=feed" className="mt-2 inline-flex items-center gap-1.5 text-[14.5px] font-semibold text-action underline underline-offset-2">
            <Trophy aria-hidden className="h-4 w-4" /> Тэргүүлэгчид
          </Link>
        </div>
        <div className="flex items-center gap-2 text-[14px]">
          <span className="text-muted">Сонирхол:</span>
          <span className="rounded-full border border-line bg-surface px-3 py-1 font-semibold">{personaLabels[active]}</span>
          <button type="button" onClick={() => setChoosing(true)} className="font-semibold text-fg underline underline-offset-2">
            Солих
          </button>
          {gain > 0 ? <span className="animate-pop rounded-full bg-good px-2 py-0.5 text-[13px] font-bold text-white">+{gain} оноо</span> : null}
        </div>
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {needsChoice ? (
            <PersonaSelect initial={persona} onPick={pickPersona} onCancel={choosing ? () => setChoosing(false) : undefined} />
          ) : error ? (
            <ErrorState
              description={`${error.message}. Түр хүлээгээд дахин оролдоно уу.`}
              retry={() => {
                setFailed(null);
                setReloadKey((k) => k + 1);
              }}
            />
          ) : cards === null ? (
            <ListSkeleton rows={1} />
          ) : cards.length === 0 ? (
            <EmptyState
              title={active === "ALL" ? "Одоогоор карт нийтлэгдээгүй байна" : "Энэ сонголтод тохирох карт алга"}
              description={
                active === "ALL"
                  ? "Шинэ хуулийн өөрчлөлт нэмэгдмэгц энд харагдана. Одоохондоо хуулийн жагсаалтыг үзэж болно."
                  : "Одоогоор энэ бүлэгт зориулсан карт байхгүй байна. Бүх картыг харах боломжтой."
              }
              action={active === "ALL" ? undefined : <Button onClick={() => pickPersona("ALL")}>Бүх картыг харах</Button>}
            />
          ) : (
            <>
            <p className="mb-3 flex items-start gap-2 rounded-xl border border-brand-100 bg-action-bg px-4 py-2.5 text-[14px] text-action">
              <Sparkles aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                Оноо авахын тулд картыг уншаад асуултад нь хариул: зөв хариулт бүр +{POINTS.QUIZ_CORRECT}, картын анхны зөв хариултад нэмээд +{POINTS.CARD_VIEW}. Зөвхөн гүйлгэхэд оноо өгөхгүй.
              </span>
            </p>
            <CardReader
              cards={cards}
              index={index}
              onIndexChange={setIndex}
              viewedIds={viewedIds}
              isSignedIn={Boolean(isSignedIn)}
              onCardViewed={onCardViewed}
              onAnswered={onAnswered}
            />
            </>
          )}
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-36 lg:self-start">
          <StreakPanel />
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line">
            <div className="bg-surface px-4 py-3">
              <dt className="text-[13px] text-muted">Нөлөөний оноо</dt>
              <dd className="font-serif text-[24px] font-bold tabular-nums text-heading">{points.toLocaleString("mn-MN")}</dd>
            </div>
            <div className="bg-surface px-4 py-3">
              <dt className="text-[13px] text-muted">Өнөөдөр уншсан</dt>
              <dd className="font-serif text-[24px] font-bold tabular-nums text-heading">
                {viewedIds.length} <span className="font-sans text-[14px] font-medium text-muted">карт</span>
              </dd>
            </div>
          </dl>
          {cards && cards.length > 0 ? (
            <nav aria-label="Өнөөдрийн картууд" className="rounded-2xl border border-line bg-surface p-4">
              <h2 className="font-sans text-[13.5px] font-semibold text-heading">Өнөөдрийн картууд</h2>
              <ol className="mt-2 flex max-h-80 flex-col gap-0.5 overflow-y-auto scroll-slim">
                {cards.map((c, i) => {
                  const done = viewedIds.includes(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => setIndex(i)}
                        aria-current={i === index ? "true" : undefined}
                        className={cn(
                          "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[14px] hover:bg-surface-2",
                          i === index && "bg-surface-2 font-semibold",
                        )}
                      >
                        {done ? (
                          <CheckCircle2 aria-label="Уншсан" className="mt-0.5 h-4 w-4 shrink-0 text-good" />
                        ) : (
                          <Circle aria-label="Уншаагүй" className="mt-0.5 h-4 w-4 shrink-0 text-line-strong" />
                        )}
                        <span className="line-clamp-2">{c.hook}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : null}
        </aside>
      </div>
    </Container>
  );
}
