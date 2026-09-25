"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/pill";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { mockVoteEvents } from "@/lib/mock";
import type { VoteEvent } from "@/lib/types";
import { cn } from "@/lib/cn";

// ② Таамаг — санал хураалтыг таамаглах.
// ДЕМО: үйл явдлууд lib/mock.ts-ээс. Dev 1-ийн GET /api/vote-events ба
// POST /api/vote-events/[id]/predict бэлэн болмогц тийш шилжинэ.
export default function PredictPage() {
  const events = mockVoteEvents;

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

      {events.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            emoji="🎯"
            title="Одоогоор нээлттэй таамаг алга"
            description="Санал хураалт товлогдмогц энд гарч ирнэ."
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-5">
          {events.map((e) => (
            <PredictCard key={e.id} event={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function PredictCard({ event }: { event: VoteEvent }) {
  const toast = useToast();
  const reduce = useReducedMotion();
  const [willPass, setWillPass] = useState<boolean | null>(null);
  const [support, setSupport] = useState(38); // УИХ 76 гишүүний дунд утга
  const [sent, setSent] = useState(false);

  const revealed = event.status === "REVEALED";

  function submit() {
    if (willPass === null) {
      toast("Эхлээд «Батлагдана» эсвэл «Батлагдахгүй» гэж сонгоно уу", "bad");
      return;
    }
    // Одоогоор зөвхөн энэ төхөөрөмж дээр. Dev 1-ийн API бэлэн болмогц
    // POST /api/vote-events/[id]/predict руу илгээнэ.
    setSent(true);
    toast("Таамаг хүлээж авлаа", "ok");
  }

  return (
    <article className="rounded-3xl border border-ink-200 bg-white p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        {event.isReplay ? (
          <Pill tone="neutral">Өмнө болсон санал хураалт — дахин тоглох</Pill>
        ) : (
          <Pill tone="brand">Нээлттэй</Pill>
        )}
      </div>

      <h2 className="mt-3 text-[20px] font-extrabold leading-snug tracking-tight text-ink-950">
        {event.hook}
      </h2>
      <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-600">
        {event.title}
      </p>

      {revealed ? (
        // Бодит тоо зөвхөн ParliamentAPI-аас ирнэ — энд хэзээ ч зохиомол тоо бичихгүй
        <div className="mt-4 rounded-2xl bg-ink-50 p-4 text-[15px] font-semibold text-ink-700">
          Үр дүн нээгдсэн.
        </div>
      ) : sent ? (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 rounded-2xl bg-ok-50 p-4"
        >
          <p className="text-[15.5px] font-extrabold text-ok-800">
            Таны таамаг: {willPass ? "Батлагдана" : "Батлагдахгүй"} ·{" "}
            {support} гишүүн дэмжинэ
          </p>
          <p className="mt-1 text-[14px] font-semibold text-ink-700">
            Бодит санал хураалт болмогц үр дүнг харуулж, оноог тооцно.
          </p>
        </motion.div>
      ) : (
        <div className="mt-5 flex flex-col gap-5">
          {/* Батлагдах уу? */}
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
                  className={cn(
                    "press min-h-14 rounded-2xl border-2 text-[16px] font-extrabold",
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

          {/* Хэдэн гишүүн дэмжих вэ? */}
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
                max={76}
                value={support}
                onChange={(e) => setSupport(Number(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-ink-200 accent-brand-600"
              />
              <span className="w-16 shrink-0 rounded-xl bg-brand-50 py-1.5 text-center text-[17px] font-extrabold tabular-nums text-brand-700">
                {support}
              </span>
            </div>
            <p className="mt-1.5 text-[13px] text-ink-600">
              УИХ-ын нийт 76 гишүүнээс
            </p>
          </div>

          <Button onClick={submit} size="lg" className="w-full">
            Таамаг илгээх
          </Button>
        </div>
      )}
    </article>
  );
}
