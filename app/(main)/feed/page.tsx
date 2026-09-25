"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { FeedCard, Persona, QuizAnswerResult } from "@/lib/types";
import {
  fetchFeed,
  fetchMe,
  postCardView,
  postPersona,
} from "@/components/feed/feed-data";
import {
  readProgress,
  writeProgress,
  recordCardView,
  recordQuizAnswer,
  type Progress,
} from "@/components/feed/progress-store";
import { FeedDeck } from "@/components/feed/feed-deck";
import { FeedSkeleton } from "@/components/feed/feed-skeleton";
import { PersonaSheet } from "@/components/feed/persona-sheet";
import { PersonaChip } from "@/components/feed/persona-chip";
import { QuizSheet } from "@/components/feed/quiz-sheet";
import { SaveProgressSheet } from "@/components/feed/save-progress-sheet";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { StreakFlame } from "@/components/ui/streak-flame";

// ① Өнөөдрийн хууль — бодит API-аас (GET /api/feed).
// Оноо, streak: нэвтэрсэн бол СЕРВЕР эрх мэдэлтэй; зочин бол localStorage.
export default function FeedPage() {
  const { isSignedIn, isLoaded } = useUser();

  const [progress, setProgress] = useState<Progress | null>(null); // зочны
  const [server, setServer] = useState<{ points: number; streak: number } | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  const [loaded, setLoaded] = useState<{ persona: Persona; cards: FeedCard[] } | null>(null);
  const [failed, setFailed] = useState<{ persona: Persona; message: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [index, setIndex] = useState(0);

  const [personaOpen, setPersonaOpen] = useState(false);
  const [quizCard, setQuizCard] = useState<FeedCard | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [pop, setPop] = useState(false);

  const progressRef = useRef<Progress | null>(null);

  // 1. Төхөөрөмж дээрх явцыг уншина (зөвхөн хөтөч дээр, нэг удаа)
  useEffect(() => {
    const p = readProgress();
    progressRef.current = p;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage бол гаднын сан; зөвхөн холбогдсоны дараа уншиж болно
    setProgress(p);
    setPersona(p.persona ?? "ALL");
    if (p.persona === null) setPersonaOpen(true);
  }, []);

  // 2. Нэвтэрсэн бол серверийн оноо, streak, бүлгийг авна
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    fetchMe().then((me) => {
      if (cancelled || !me) return;
      setServer({ points: me.points, streak: me.streak });
      // Серверт хадгалсан бүлэг байвал түүнийг нь дагана
      setPersona(me.persona);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  // 3. Бүлгээр фийд татна
  useEffect(() => {
    if (persona === null) return;
    let cancelled = false;
    fetchFeed(persona)
      .then((cards) => {
        if (cancelled) return;
        setLoaded({ persona, cards });
        setIndex(0);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setFailed({
          persona,
          message: e instanceof Error ? e.message : "Хуулиудыг татаж чадсангүй",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [persona, reloadKey]);

  const cards = loaded && loaded.persona === persona ? loaded.cards : null;
  const error = failed && failed.persona === persona ? failed : null;

  // 4. Бүлэг сонгох / солих
  const pickPersona = useCallback(
    (picked: Persona) => {
      setPersonaOpen(false);
      setPersona(picked);
      const base = progressRef.current ?? readProgress();
      const next = { ...base, persona: picked };
      progressRef.current = next;
      writeProgress(next);
      setProgress(next);
      if (isSignedIn) postPersona(picked); // зочинд 401 ирэх нь хэвийн
    },
    [isSignedIn],
  );

  // 5. Карт үзсэн — нэвтэрсэн бол серверийн тоог, эс бөгөөс локалыг хэрэглэнэ
  const onCardViewed = useCallback(async (card: FeedCard) => {
    const result = await postCardView(card.id);

    if (result?.saved) {
      setServer({ points: result.points ?? 0, streak: result.streak ?? 0 });
      if (result.pointsAwarded > 0) {
        setPop(true);
        setTimeout(() => setPop(false), 900);
      }
      return;
    }

    // Зочин — төхөөрөмж дээрээ тоолно
    const p = progressRef.current;
    if (!p) return;
    const { next, gained } = recordCardView(p, card.id);
    progressRef.current = next;
    setProgress(next);
    if (gained > 0) {
      setPop(true);
      setTimeout(() => setPop(false), 900);
    }
  }, []);

  // 6. Викторын хариу ирэхэд оноог шинэчилнэ
  const onAnswered = useCallback((questionId: string, result: QuizAnswerResult) => {
    if (result.saved) {
      setServer((s) => ({
        points: result.points ?? s?.points ?? 0,
        streak: s?.streak ?? 0,
      }));
      return;
    }
    const p = progressRef.current;
    if (!p || !result.correct) return;
    const { next } = recordQuizAnswer(p, questionId, 3);
    progressRef.current = next;
    setProgress(next);
  }, []);

  // 7. Эхний виктор дуусахад зочноос зөөлөн асууна (нэг л удаа)
  const onQuizFinished = useCallback(() => {
    const p = progressRef.current;
    if (!p || isSignedIn || p.askedToSave) return;
    const next = { ...p, askedToSave: true };
    progressRef.current = next;
    writeProgress(next);
    setProgress(next);
    setSaveOpen(true);
  }, [isSignedIn]);

  // Нэвтэрсэн бол сервер, эс бөгөөс локал
  const points = server?.points ?? progress?.points ?? 0;
  const streak = server?.streak ?? progress?.streak ?? 0;
  const sheetOpen = personaOpen || quizCard !== null || saveOpen;

  return (
    <div className="mx-auto flex h-[calc(100dvh_-_4rem_-_var(--bottom-nav-h))] max-w-2xl flex-col px-4 py-3 sm:px-6">
      <div className="flex shrink-0 flex-wrap items-center gap-2 pb-3">
        <PersonaChip
          persona={persona ?? "ALL"}
          onClick={() => setPersonaOpen(true)}
        />
        <div className="ml-auto flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-point-100 px-3 py-1.5 text-[14px] font-extrabold tabular-nums text-point-700">
            {points.toLocaleString("mn-MN")} оноо
          </span>
          <StreakFlame days={streak} size="sm" />
        </div>
      </div>

      {error ? (
        <div className="flex min-h-0 flex-1 items-center">
          <ErrorState
            description={`${error.message}. Түр хүлээгээд дахин оролдоно уу.`}
            retry={() => {
              setFailed(null);
              setReloadKey((k) => k + 1);
            }}
          />
        </div>
      ) : cards === null ? (
        <FeedSkeleton />
      ) : cards.length === 0 ? (
        <div className="flex min-h-0 flex-1 items-center">
          <EmptyState
            emoji="🔍"
            title={
              persona === "ALL"
                ? "Одоогоор хууль нэмэгдээгүй байна"
                : "Энэ бүлэгт тохирох хууль алга"
            }
            description={
              persona === "ALL"
                ? "Шинэ хууль нэмэгдмэгц энд хамгийн түрүүнд харагдана."
                : "Одоогоор энэ бүлэгт зориулсан карт байхгүй байна. Бүх хуулийг харах боломжтой."
            }
            action={
              persona === "ALL" ? undefined : (
                <button
                  type="button"
                  onClick={() => pickPersona("ALL")}
                  className="press min-h-12 rounded-2xl bg-brand-600 px-5 text-[15px] font-extrabold text-white shadow-brand hover:bg-brand-700"
                >
                  Бүгдийг харах
                </button>
              )
            }
          />
        </div>
      ) : (
        <FeedDeck
          cards={cards}
          index={index}
          onIndexChange={setIndex}
          streak={streak}
          paused={sheetOpen}
          pointsPop={pop}
          onOpenQuiz={setQuizCard}
          onCardViewed={onCardViewed}
        />
      )}

      <PersonaSheet
        open={personaOpen}
        onClose={() => {
          if (progressRef.current?.persona == null) pickPersona("ALL");
          else setPersonaOpen(false);
        }}
        onPick={pickPersona}
      />

      <QuizSheet
        open={quizCard !== null}
        onClose={() => setQuizCard(null)}
        questions={quizCard?.quiz ?? []}
        onAnswered={onAnswered}
        onFinished={onQuizFinished}
        hasNextCard={cards !== null && index < cards.length - 1}
        onNextCard={() => setIndex((i) => i + 1)}
      />

      <SaveProgressSheet
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        points={points}
        streak={streak}
      />
    </div>
  );
}
