import Link from "next/link";
import type { Law } from "@/lib/stub/types";
import { LawTimeline } from "./law-timeline";
import { StatusPill } from "@/components/ui/status-pill";

const stageTone: Record<Law["stage"], { label: string; tone: "info" | "warn" | "good" | "neutral" }> = {
  draft: { label: "Төсөл", tone: "neutral" },
  debate: { label: "Хэлэлцэгдэж буй", tone: "info" },
  passed: { label: "Батлагдсан", tone: "good" },
  implementation: { label: "Хэрэгжилт", tone: "warn" },
};

export function LawCard({ law }: { law: Law }) {
  const s = stageTone[law.stage];
  return (
    <Link
      href={`/laws/${law.id}`}
      className="group flex flex-col gap-4 rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.35)] transition hover:-translate-y-0.5 hover:border-parliament-200 hover:shadow-[0_30px_55px_-30px_rgba(15,42,99,0.45)] animate-rise"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <StatusPill tone={s.tone}>{s.label}</StatusPill>
            <span className="text-[11px] text-ink-500">{law.category}</span>
          </div>
          <h3 className="mt-2 text-[15px] font-semibold leading-snug text-ink-900 group-hover:text-parliament-900">
            {law.title}
          </h3>
        </div>
        <div className="text-right text-[10.5px] text-ink-500">
          <div>Дагагч</div>
          <div className="text-sm font-bold text-parliament-800">
            {law.followers.toLocaleString("mn-MN")}
          </div>
        </div>
      </div>
      <p className="line-clamp-2 text-[12.5px] leading-relaxed text-ink-500">
        {law.summary}
      </p>
      <LawTimeline current={law.stage} />
    </Link>
  );
}
