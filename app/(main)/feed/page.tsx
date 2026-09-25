"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { FeedCard, Persona } from "@/lib/types";
import { fetchFeed, postCardView, postPersona } from "@/components/feed/feed-data";
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

// ① Өнөөдрийн хууль — 60 секундийн картууд.
// Зочин бүх зүйлийг ашиглана; нэвтрэх нь зөвхөн оноо хадгалахад хэрэгтэй.
export default function FeedPage() {
  const { isSignedIn } = useUser();

  const [progress, setProgress] = useState<Progress | null>(null);
  const [persona, setPersona] = useState<Persona | null>(null);
  // Татсан үр дүнг аль бүлгийнх болохтой нь хамт хадгална. Ингэснээр
  // "ачаалж байна" төлөвийг тооцож гаргах бөгөөд нэмэлт setState хэрэггүй.
  const [loaded, setLoaded] = useState<{ persona: Persona; cards: FeedCard[] } | null>(null);
  const [errorFor, setErrorFor] = useState<Persona | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [index, setIndex] = useState(0);

  const [personaOpen, setPersonaOpen] = useState(false);
  const [quizCard, setQuizCard] = useState<FeedCard | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [pop, setPop] = useState(false);

  // Явцыг үргэлж шинэ утгаар нь уншихын тулд ref-д давхар хадгална
  const progressRef = useRef<Progress | null>(null);

  // 1. Төхөөрөмж дээрх явцыг уншина (зөвхөн хөтөч дээр, нэг удаа).
  useEffect(() => {
    const p = readProgress();
    progressRef.current = p;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage бол гаднын сан; үүнийг зөвхөн холбогдсоны дараа уншиж болно
    setProgress(p);
    setPersona(p.persona ?? "ALL");
    // Анх ирсэн хүнээс "Би хэн бэ?" гэж асууна
    if (p.persona === null) setPersonaOpen(true);
  }, []);

  // 2. Бүлэг солигдоход (эсвэл дахин оролдоход) фийдийг татна.
  useEffect(() => {
    if (persona === null) return;
    let cancelled = false;
    fetchFeed(persona)
      .then(({ cards }) => {
        if (cancelled) return;
        setLoaded({ persona, cards });
        setIndex(0);
      })
      .catch(() => {
        if (!cancelled) setErrorFor(persona);
      });
    return () => {
      cancelled = true;
    };
  }, [persona, reloadKey]);

  // Одоогийн бүлгийнх биш бол "ачаалж байна" гэж үзнэ
  const cards = loaded && loaded.persona === persona ? loaded.cards : null;
  const error = errorFor !== null && errorFor === persona;

  // 3. Бүлэг сонгох / солих
  const pickPersona = useCallback(
    (picked: Persona) => {
      setPersonaOpen(false);
      setPersona(picked);
      const base = progressRef.current ?? readProgress();
      const next = { ...base, persona: picked };
      progressRef.current = next;
      writeProgress(next);
      setProgress(next);
      if (isSignedIn) postPersona(picked);
    },
    [isSignedIn],
  );

  // 4. Карт үзсэн — өдөрт нэг удаа +1 оноо, шаардлагатай бол streak нэмэгдэнэ
  const onCardViewed = useCallback((card: FeedCard) => {
    const p = progressRef.current;
    if (!p) return;
    const { next, gained } = recordCardView(p, card.id);
    progressRef.current = next;
    setProgress(next);
    if (gained > 0) {
      setPop(true);
      setTimeout(() => setPop(false), 900);
    }
    postCardView(card.id);
  }, []);

  // 5. Викторын зөв хариулт — асуулт тутамд нэг л удаа оноо
  const onQuizPoints = useCallback((questionId: string, points: number) => {
    const p = progressRef.current;
    if (!p) return;
    const { next } = recordQuizAnswer(p, questionId, points);
    progressRef.current = next;
    setProgress(next);
  }, []);

  // 6. Эхний виктор дуусахад зочноос зөөлөн асууна (нэг л удаа)
  const onQuizFinished = useCallback(() => {
    const p = progressRef.current;
    if (!p || isSignedIn || p.askedToSave) return;
    const next = { ...p, askedToSave: true };
    progressRef.current = next;
    writeProgress(next);
    setProgress(next);
    setSaveOpen(true);
  }, [isSignedIn]);

  const points = progress?.points ?? 0;
  const streak = progress?.streak ?? 0;
  const sheetOpen = personaOpen || quizCard !== null || saveOpen;

  return (
    <div className="mx-auto flex h-[calc(100dvh_-_4rem_-_var(--bottom-nav-h))] max-w-2xl flex-col px-4 py-3 sm:px-6">
      {/* Дээд мөр: бүлэг + оноо + streak */}
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
            retry={() => {
              setErrorFor(null);
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
            title="Энэ бүлэгт тохирох хууль алга"
            description="Одоогоор энэ бүлэгт зориулсан карт байхгүй байна. Бүх хуулийг харах боломжтой."
            action={
              <button
                type="button"
                onClick={() => pickPersona("ALL")}
                className="press min-h-12 rounded-2xl bg-brand-600 px-5 text-[15px] font-extrabold text-white shadow-brand hover:bg-brand-700"
              >
                Бүгдийг харах
              </button>
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
          // Анх удаа хаавал "Бүгд" гэж үзнэ — уншихыг хэзээ ч хаахгүй
          if (progressRef.current?.persona == null) pickPersona("ALL");
          else setPersonaOpen(false);
        }}
        onPick={pickPersona}
      />

      <QuizSheet
        open={quizCard !== null}
        onClose={() => setQuizCard(null)}
        questions={quizCard?.quiz ?? []}
        onPoints={onQuizPoints}
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
