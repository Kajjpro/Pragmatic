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
import { PageLoading } from "@/components/ui/page-loading";
import { Button } from "@/components/ui/button";

// ① Өнөөдрийн хууль. Өгөгдөл: GET /api/feed (DB-ээс, AI дуудахгүй).
// Оноо, дараалсан өдөр: нэвтэрсэн бол сервер эрх мэдэлтэй; зочин бол төхөөрөмж дээр.
export default function FeedPage() {
  const { isSignedIn } = useUser();
  const { me } = useMe();

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
    [showGain],
  );

  // 4. Асуултад хариулсан
  const onAnswered = useCallback(
    (questionId: string, result: QuizAnswerResult) => {
      if (result.saved) {
        setOverride((s) => ({ points: result.points ?? s?.points ?? 0, streak: s?.streak ?? 0 }));
        showGain(result.pointsAwarded);
        return;
      }
      const p = progressRef.current;
      if (!p || !result.correct) return;
      const { next, gained } = recordQuizAnswer(p, questionId, 3);
      progressRef.current = next;
      setProgress(next);
      showGain(gained);
    },
    [showGain],
  );

  const points = override?.points ?? me?.points ?? progress?.points ?? 0;
  const streak = override?.streak ?? me?.streak ?? progress?.streak ?? 0;

  return (
    <Container className="max-w-3xl py-8">
      <div className="flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold">Өнөөдрийн хууль</h1>
          <p className="mt-1 text-[15px] text-muted">
            Сонирхол: {personaLabels[active]}.{" "}
            <button type="button" onClick={() => setChoosing(true)} className="font-medium text-action underline underline-offset-2">
              Солих
            </button>
          </p>
        </div>
        <dl className="flex gap-6 text-[14px]">
          <div>
            <dt className="text-muted">Дараалсан өдөр</dt>
            <dd className="font-serif text-[22px] font-bold tabular-nums text-heading">{streak}</dd>
          </div>
          <div>
            <dt className="text-muted">Оролцооны оноо</dt>
            <dd className="font-serif text-[22px] font-bold tabular-nums text-heading">
              {points.toLocaleString("mn-MN")}
              {gain > 0 ? <span className="ml-2 font-sans text-[14px] font-medium text-good-fg">+{gain} оноо</span> : null}
            </dd>
          </div>
        </dl>
      </div>

      <div className="mt-6">
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
          <PageLoading rows={1} />
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
          <CardReader
            cards={cards}
            index={index}
            onIndexChange={setIndex}
            isSignedIn={Boolean(isSignedIn)}
            onCardViewed={onCardViewed}
            onAnswered={onAnswered}
          />
        )}
      </div>
    </Container>
  );
}
