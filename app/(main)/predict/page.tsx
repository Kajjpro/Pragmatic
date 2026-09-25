"use client";

import { useCallback, useEffect, useState } from "react";
import { Vote } from "lucide-react";
import { Container, PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { PageLoading } from "@/components/ui/page-loading";
import { PredictCard } from "@/components/predict/predict-card";
import { fetchVoteEvents } from "@/components/feed/feed-data";
import { useMe } from "@/components/shell/me-context";
import type { VoteEvent } from "@/lib/types";

// ② Таамаг. Өгөгдөл: GET /api/vote-events; өөрийн таамгийг GET /api/me-ээс.
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

  const mineByEvent = new Map((me?.predictions ?? []).map((p) => [p.voteEventId, p]));

  return (
    <Container className="max-w-3xl py-10">
      <PageHeader
        title="Таамаг"
        description="Санал хураалтын дүнг урьдчилан таамаглаад бодит дүнтэй харьцуулна уу. Бид зөвхөн тоо харуулна: гишүүн, намын нэр дурдахгүй."
      />
      <div className="mt-6">
        {error ? (
          <ErrorState description={`${error}. Түр хүлээгээд дахин оролдоно уу.`} retry={reload} />
        ) : events === null ? (
          <PageLoading rows={2} />
        ) : events.length === 0 ? (
          <EmptyState
            icon={Vote}
            title="Одоогоор таамаглах санал хураалт алга"
            description="УИХ-ын санал хураалтыг ажлын алба нэмэхэд энд харагдана. Энэ хооронд хуулийн өөрчлөлтүүдийг уншиж болно."
          />
        ) : (
          <div className="flex flex-col gap-5">
            {events.map((e) => (
              <PredictCard key={e.id} event={e} mine={mineByEvent.get(e.id)} onSaved={onSaved} />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}
