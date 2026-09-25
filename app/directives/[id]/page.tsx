import Link from "next/link";
import { notFound } from "next/navigation";
import { getDirective } from "@/lib/stub/reports";
import { getLaw } from "@/lib/stub/laws";
import { FlagBadge } from "@/components/monitoring/flag-badge";
import { ScoreCompare } from "@/components/monitoring/score-compare";
import { StatusPill } from "@/components/ui/status-pill";
import { ClusterCard } from "@/components/feedback/cluster-card";
import { EvidenceForm } from "@/components/feedback/evidence-form";

const statusMap = {
  "on-track": { label: "Хугацаандаа", tone: "info" as const },
  "at-risk": { label: "Эрсдэлтэй", tone: "warn" as const },
  "off-track": { label: "Хоцорсон", tone: "danger" as const },
  done: { label: "Дууссан", tone: "good" as const },
};

export default async function DirectiveDetailPage({
  params,
}: PageProps<"/directives/[id]">) {
  const { id } = await params;
  const directive = getDirective(id);
  if (!directive) notFound();
  const law = getLaw(directive.lawId);
  const s = statusMap[directive.status];

  return (
    <div className="bg-parliament-50/30 pb-16">
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-8">
          <nav className="flex items-center gap-2 text-[12px] text-ink-500">
            <Link href="/" className="hover:text-parliament-800">
              Эхлэл
            </Link>
            <span>/</span>
            <span className="text-parliament-900">Хэрэгжилтийн үүрэг</span>
          </nav>
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-parliament-50 px-2 py-0.5 font-mono text-[11px] font-semibold text-parliament-800">
                  {directive.code}
                </span>
                <FlagBadge level={directive.flag} />
                <StatusPill tone={s.tone}>{s.label}</StatusPill>
              </div>
              <h1 className="mt-2 text-2xl font-bold text-parliament-900">
                {directive.goal}
              </h1>
              <p className="mt-2 text-[13px] leading-relaxed text-ink-500">
                Энэ зорилтыг {directive.owner} хариуцаж, {directive.deadline}-ны
                дотор биелүүлэх ёстой. Иргэдийн эргэн мэдээлэл дараах
                бүлгүүдэд ангилагдсан.
              </p>
            </div>
            <div className="rounded-2xl border border-ink-100 bg-white p-4">
              <ScoreCompare
                ownerScore={directive.ownerScore}
                auditorScore={directive.auditorScore}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-6 pt-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-ink-100 bg-white p-5">
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
              Энгийн тайлбар
            </h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-700">
              {directive.fullText}
            </p>
            {law ? (
              <Link
                href={`/laws/${law.id}`}
                className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-semibold text-parliament-800 hover:text-parliament-900"
              >
                Эх хууль: {law.title} →
              </Link>
            ) : null}
          </div>

          {directive.evidenceClusters.length ? (
            <div className="rounded-2xl border border-ink-100 bg-white p-5">
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
                Иргэдийн нотолгооны бүлгүүд
              </h3>
              <div className="mt-3 flex flex-col gap-2">
                {directive.evidenceClusters.map((c) => (
                  <ClusterCard key={c.id} cluster={c} />
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-col gap-6">
          <EvidenceForm />
          <div className="rounded-2xl border border-ink-100 bg-white p-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
              Хариуцагч
            </h4>
            <div className="mt-2 text-[13px] font-semibold text-ink-900">
              {directive.owner}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
              <div className="rounded-lg bg-parliament-50/60 p-2">
                <div className="text-ink-500">Хугацаа</div>
                <div className="font-semibold text-parliament-900">
                  {directive.deadline}
                </div>
              </div>
              <div className="rounded-lg bg-parliament-50/60 p-2">
                <div className="text-ink-500">Статус</div>
                <div className="font-semibold text-parliament-900">
                  {s.label}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
