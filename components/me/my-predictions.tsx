import Link from "next/link";
import { Vote } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Pill } from "@/components/ui/pill";
import { buttonClass } from "@/components/ui/button";
import { voteOutcomeLabel } from "@/lib/labels";
import type { Prediction, VoteEvent } from "@/lib/types";

// "Таамгууд": миний таамаг ба (гарсан бол) бодит дүн
export function MyPredictions({ rows }: { rows: (Prediction & { event: VoteEvent })[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={Vote}
        title="Та одоогоор таамаг өгөөгүй байна"
        description="Санал хураалтын дүнг таамаглаад бодит дүнтэй харьцуулаарай."
        action={
          <Link href="/predict" className={buttonClass("primary")}>
            Таамаг руу очих
          </Link>
        }
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((p) => {
        const e = p.event;
        const revealed = e.status === "REVEALED";
        return (
          <li key={p.voteEventId} className="rounded-lg border border-line bg-surface p-5">
            <div className="flex flex-wrap items-center gap-2">
              {revealed ? <Pill tone="good">Дүн гарсан</Pill> : <Pill tone="action">Дүн хүлээгдэж буй</Pill>}
              {e.isReplay ? <Pill>Өмнө болсон санал хураалт</Pill> : null}
            </div>
            <p className="mt-2 font-semibold text-fg">{e.title}</p>
            <dl className="mt-3 grid gap-2 text-[15px] sm:grid-cols-2">
              <div>
                <dt className="text-muted">Таны таамаг</dt>
                <dd>
                  {p.willPass ? "Тийм" : "Үгүй"}, <span className="tabular-nums">{p.supportGuess}</span> гишүүн
                </dd>
              </div>
              {revealed ? (
                <div>
                  <dt className="text-muted">Бодит дүн</dt>
                  <dd>
                    <span className="tabular-nums">{e.actualSupport}</span> дэмжсэн /{" "}
                    <span className="tabular-nums">{e.actualTotal}</span> нийт — {voteOutcomeLabel(e.passed === true)}
                  </dd>
                </div>
              ) : null}
            </dl>
            {revealed ? (
              <p className="mt-2 text-[14.5px] tabular-nums text-muted">
                {p.points > 0 ? `+${p.points} оноо` : "Энэ удаа оноо нэмэгдсэнгүй"}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
