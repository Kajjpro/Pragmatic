import Link from "next/link";
import { notFound } from "next/navigation";
import { getLaw } from "@/lib/stub/laws";
import { getAllDirectives } from "@/lib/stub/reports";
import { LawTimeline } from "@/components/law/law-timeline";
import { LawDetailTabs } from "@/components/law/law-detail-tabs";
import { StatusPill } from "@/components/ui/status-pill";

export default async function LawDetailPage({
  params,
}: PageProps<"/laws/[id]">) {
  const { id } = await params;
  const law = getLaw(id);
  if (!law) notFound();

  const directives = getAllDirectives().filter((d) =>
    law.directiveIds.includes(d.id),
  );

  return (
    <div className="bg-parliament-50/30 pb-16">
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-6 py-8">
          <nav className="flex items-center gap-2 text-[12px] text-ink-500">
            <Link href="/" className="hover:text-parliament-800">
              Эхлэл
            </Link>
            <span>/</span>
            <span className="text-parliament-900">Хуулиуд</span>
          </nav>
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-2">
                <StatusPill tone="info">{law.category}</StatusPill>
                <span className="text-[11.5px] text-ink-500">
                  Шинэчлэгдсэн {law.updatedAt}
                </span>
              </div>
              <h1 className="mt-2 max-w-3xl text-2xl font-bold text-parliament-900">
                {law.title}
              </h1>
              <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-500">
                {law.summary}
              </p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-full border border-parliament-100 bg-white px-4 py-2 text-[12.5px] font-semibold text-parliament-800 shadow-sm transition hover:border-parliament-500">
              <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
                <path
                  d="M10 3v14M3 10h14"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
              Дагах ({law.followers.toLocaleString("mn-MN")})
            </button>
          </div>
          <div className="mt-2 rounded-2xl border border-ink-100 bg-parliament-50/40 px-5 py-4">
            <LawTimeline current={law.stage} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 pt-8">
        <LawDetailTabs law={law} directives={directives} />
      </section>
    </div>
  );
}
