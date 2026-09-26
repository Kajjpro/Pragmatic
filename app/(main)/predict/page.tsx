"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Scale, Trophy, Vote } from "lucide-react";
import { Container } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ListSkeleton } from "@/components/ui/page-loading";
import { PredictCard } from "@/components/predict/predict-card";
import { fetchVoteEvents } from "@/components/feed/feed-data";
import { useMe } from "@/components/shell/me-context";
import { POINTS, SUPPORT_GUESS_POINTS } from "@/lib/points-rules";
import { cn } from "@/lib/cn";
import type { VoteEvent } from "@/lib/types";

type Filter = "OPEN" | "REVEALED" | "ALL";

// ② Таамаг. Өгөгдөл: GET /api/vote-events (УИХ-ын ParliamentAPI getAgendaVoteList → sync), өөрийн таамгийг GET /api/me-ээс.
export default function PredictPage() {
  const { me, refresh } = useMe();
  const [events, setEvents] = useState<VoteEvent[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [filter, setFilter] = useState<Filter>("ALL");

  useEffect(() => {
    let cancelled = false;
    fetchVoteEvents()
      .then((e) => {
        if (!cancelled) setEvents(e);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Санал хураалтыг ачаалж чадсангүй");
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

  const onSaved = useCallback(() => {
    refresh();
    setReloadKey((k) => k + 1);
  }, [refresh]);

  const mine = me?.predictions ?? [];
  const mineByEvent = new Map(mine.map((p) => [p.voteEventId, p]));
  const revealedMine = mine.filter((p) => p.event.status === "REVEALED");
  const correct = revealedMine.filter((p) => p.willPass === p.event.passed).length;
  const earned = mine.reduce((sum, p) => sum + p.points, 0);

  const counts = {
    ALL: events?.length ?? 0,
    OPEN: events?.filter((e) => e.status === "OPEN").length ?? 0,
    REVEALED: events?.filter((e) => e.status === "REVEALED").length ?? 0,
  };
  const shown = (events ?? []).filter((e) => filter === "ALL" || e.status === filter);

  return (
    <Container className="py-8">
      <div className="flex flex-col gap-2">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-gold-fg">Санал хураалтын таамаг</p>
        <h1 className="text-[30px] font-bold sm:text-[34px]">Таамаг</h1>
        <p className="max-w-2xl text-[15.5px] text-muted">
          УИХ-ын санал хураалтын дүнг урьдчилан таамаглаад бодит дүнтэй харьцуулна уу. Дүн гармагц оноо автоматаар бодогдоно.
        </p>
        <Link href="/leaderboard?tab=predict" className="inline-flex w-fit items-center gap-1.5 text-[14.5px] font-semibold text-action underline underline-offset-2">
          <Trophy aria-hidden className="h-4 w-4" /> Тэргүүлэгчид
        </Link>
      </div>

      <div className="mt-7 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          {me ? (
            <dl className="mb-5 grid grid-cols-3 gap-px overflow-hidden rounded-2xl border border-line bg-line">
              {(
                [
                  ["Миний таамаг", mine.length],
                  ["Зөв таасан", revealedMine.length > 0 ? `${correct}/${revealedMine.length}` : "—"],
                  ["Таамгийн оноо", earned],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="bg-surface px-4 py-3">
                  <dt className="text-[13px] text-muted">{label}</dt>
                  <dd className="font-serif text-[24px] font-bold tabular-nums text-heading">{value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          <div role="tablist" aria-label="Шүүлт" className="mb-5 inline-flex rounded-full border border-line bg-surface p-1">
            {(
              [
                ["ALL", "Бүгд"],
                ["OPEN", "Нээлттэй"],
                ["REVEALED", "Дүн гарсан"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={filter === key}
                onClick={() => setFilter(key)}
                className={cn(
                  "min-h-9 rounded-full px-4 text-[14px] font-semibold transition-colors",
                  filter === key ? "bg-primary text-on-primary" : "text-muted hover:text-fg",
                )}
              >
                {label} <span className="tabular-nums opacity-70">{counts[key]}</span>
              </button>
            ))}
          </div>

          {error ? (
            <ErrorState description={`${error}. Түр хүлээгээд дахин оролдоно уу.`} retry={reload} />
          ) : events === null ? (
            <ListSkeleton rows={2} />
          ) : shown.length === 0 ? (
            <EmptyState
              icon={Vote}
              title={events.length === 0 ? "Одоогоор таамаглах санал хураалт алга" : "Энэ шүүлтэд санал хураалт алга"}
              description={
                events.length === 0
                  ? "УИХ-ын санал хураалтыг ParliamentAPI-аас татахад энд харагдана. Энэ хооронд өнөөдрийн хуулийг уншиж болно."
                  : "Өөр шүүлт сонгоно уу."
              }
            />
          ) : (
            <div className="flex flex-col gap-5">
              {shown.map((e) => (
                <PredictCard key={e.id} event={e} mine={mineByEvent.get(e.id)} onSaved={onSaved} />
              ))}
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-36 lg:self-start">
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 font-sans text-[14px] font-semibold text-heading">
              <Scale aria-hidden className="h-4 w-4" /> Төвийг сахина
            </h2>
            <p className="mt-2 text-[14.5px] text-muted">
              Бид гишүүн, намыг үнэлдэггүй, жагсаадаггүй. Зөвхөн санал хураалтын тоо: хэдэн гишүүн дэмжсэн, татгалзсан.
            </p>
          </section>
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-sans text-[14px] font-semibold text-heading">Оноо хэрхэн бодогдох вэ</h2>
            <ul className="mt-3 flex flex-col gap-2 text-[14.5px]">
              <li className="flex justify-between gap-3">
                <span className="text-muted">Батлагдах эсэхийг зөв таах</span>
                <b className="tabular-nums">+{POINTS.PREDICTION_PASS}</b>
              </li>
              {SUPPORT_GUESS_POINTS.map((t) => (
                <li key={t.within} className="flex justify-between gap-3">
                  <span className="text-muted">Дэмжих тоо ±{t.within} дотор</span>
                  <b className="tabular-nums">+{t.points}</b>
                </li>
              ))}
            </ul>
          </section>
          <section className="rounded-2xl border border-line bg-surface p-5">
            <h2 className="font-sans text-[14px] font-semibold text-heading">Эх сурвалж</h2>
            <p className="mt-2 text-[14.5px] text-muted">
              Дүнг УИХ-ын ParliamentAPI-ийн <code className="rounded bg-surface-2 px-1 text-[13px]">getAgendaVoteList</code>-оос авна.
            </p>
          </section>
        </aside>
      </div>
    </Container>
  );
}
