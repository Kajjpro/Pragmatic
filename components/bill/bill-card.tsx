import Link from "next/link";
import { StatusPill } from "@/components/ui/status-pill";

type BillCardProps = {
  id: string;
  title: string;
  description?: string | null;
  categoryTitle?: string | null;
  typeTitle?: string | null;
  projectNumber?: string | null;
  clauseCount: number;
  commentCount: number;
};

export function BillCard(p: BillCardProps) {
  return (
    <Link
      href={`/bills/${p.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)] transition hover:-translate-y-0.5 hover:border-parliament-200 hover:shadow-[0_25px_55px_-30px_rgba(15,42,99,0.45)] animate-rise"
    >
      <div className="flex items-center gap-2">
        {p.categoryTitle ? <StatusPill tone="info">{p.categoryTitle}</StatusPill> : null}
        {p.typeTitle ? (
          <span className="text-[10.5px] font-medium text-ink-500">
            {p.typeTitle}
          </span>
        ) : null}
        {p.projectNumber ? (
          <span className="ml-auto font-mono text-[10.5px] text-ink-500">
            {p.projectNumber}
          </span>
        ) : null}
      </div>
      <h3 className="font-editorial text-[16px] font-medium leading-snug text-ink-900 group-hover:text-parliament-900">
        {p.title}
      </h3>
      {p.description ? (
        <p className="line-clamp-2 text-[12.5px] leading-relaxed text-ink-500">
          {p.description}
        </p>
      ) : null}
      <div className="mt-auto flex items-center gap-4 border-t border-ink-100 pt-3 text-[11.5px] text-ink-500">
        <span>
          <b className="text-parliament-700">{p.clauseCount}</b> заалт
        </span>
        <span>
          <b className="text-parliament-700">{p.commentCount}</b> санал
        </span>
        <span className="ml-auto font-semibold text-parliament-700 group-hover:text-parliament-900">
          Санал өгөх →
        </span>
      </div>
    </Link>
  );
}
