"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { PredictCard } from "@/components/predict/predict-card";
import { fetchVoteEvents } from "@/components/feed/feed-data";
import { useMe } from "@/components/shell/me-context";
import type { VoteEvent } from "@/lib/types";

// ② Таамаг — GET /api/vote-events.
// Өөрийн таамгийг GET /api/me-ээс (MeProvider) авна.
export default function PredictPage() {
  const { me, refresh } = useMe();
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
        if (!cancelled) setError(e instanceof Error ? e.message : "Татаж чадсангүй");
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

  // Таамаг хадгалсны дараа: /api/me шинэчилнэ (тоолуур, "хадгалагдлаа" төлөв)
  const onSaved = useCallback(() => {
    refresh();
    setReloadKey((k) => k + 1);
  }, [refresh]);

  const mineByEvent = new Map(
    (me?.predictions ?? []).map((p) => [p.voteEventId, p]),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6 sm:py-8">
      <header>
        <h1 className="text-[28px] font-extrabold tracking-tight text-ink-950 sm:text-[34px]">
          Таамаг
        </h1>
        <p className="mt-1.5 text-[15.5px] leading-relaxed text-ink-600">
          Санал хураалт дэмжигдэх эсэхийг таа. Бодит дүн гармагц оноо нэмэгдэнэ.
        </p>
      </header>

      <div className="mt-6">
        {error ? (
          <ErrorState description={`${error}. Түр хүлээгээд дахин оролдоно уу.`} retry={reload} />
        ) : events === null ? (
          <div className="flex flex-col gap-4" aria-busy="true">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-3xl border border-ink-200 bg-white p-5 shadow-card">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="mt-3 h-7 w-4/5" />
                <Skeleton className="mt-2 h-4 w-3/5" />
                <Skeleton className="mt-5 h-20 w-full rounded-2xl" />
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
              <PredictCard
                key={e.id}
                event={e}
                mine={mineByEvent.get(e.id)}
                onSaved={onSaved}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
