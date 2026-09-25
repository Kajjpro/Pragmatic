import Link from "next/link";
import type { Directive } from "@/lib/stub/types";
import { FlagBadge } from "./flag-badge";
import { ScoreCompare } from "./score-compare";
import { StatusPill } from "@/components/ui/status-pill";

const statusMap: Record<
  Directive["status"],
  { label: string; tone: "info" | "warn" | "danger" | "good" }
> = {
  "on-track": { label: "Хугацаандаа", tone: "info" },
  "at-risk": { label: "Эрсдэлтэй", tone: "warn" },
  "off-track": { label: "Хоцорсон", tone: "danger" },
  done: { label: "Дууссан", tone: "good" },
};

export function DirectiveCard({ directive }: { directive: Directive }) {
  const s = statusMap[directive.status];
  return (
    <Link
      href={`/directives/${directive.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)] transition hover:-translate-y-0.5 hover:border-parliament-200 hover:shadow-[0_25px_55px_-30px_rgba(15,42,99,0.45)] animate-rise"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-parliament-50 px-2 py-0.5 font-mono text-[10.5px] font-semibold text-parliament-800">
              {directive.code}
            </span>
            <StatusPill tone={s.tone}>{s.label}</StatusPill>
            <FlagBadge level={directive.flag} />
          </div>
          <h3 className="mt-2 text-[14px] font-semibold leading-snug text-ink-900 group-hover:text-parliament-900">
            {directive.goal}
          </h3>
          <div className="mt-1 text-[11.5px] text-ink-500">
            {directive.owner} · Хугацаа {directive.deadline}
          </div>
        </div>
        <ScoreCompare
          size="sm"
          ownerScore={directive.ownerScore}
          auditorScore={directive.auditorScore}
        />
      </div>
    </Link>
  );
}
