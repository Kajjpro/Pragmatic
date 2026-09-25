import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, ExternalLink } from "lucide-react";
import { Container, PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterLinks } from "@/components/ui/filter-links";
import { Pill } from "@/components/ui/pill";
import { getPublicBills } from "@/lib/law/public";
import { stageLabels } from "@/lib/labels";
import { PERSONAS, personaLabels, type Persona } from "@/lib/types";

export const metadata: Metadata = {
  title: "Хуулийн өөрчлөлт",
  description: "Улсын Их Хурлаар хэлэлцэж буй хуулийн төслүүд: юу өөрчлөгдөх, хэнд хамаарах, иргэдийн санал.",
};

const dateFormat = new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "2-digit", day: "2-digit" });

export default async function BillsPage({ searchParams }: PageProps<"/bills">) {
  const params = await searchParams;
  const persona = PERSONAS.find((p) => p === params.persona) ?? null;
  const category = typeof params.category === "string" ? params.category : null;

  const all = await getPublicBills();
  const categories = Array.from(new Set(all.map((b) => b.categoryTitle).filter((c): c is string => Boolean(c))));
  const bills = all.filter(
    (b) => (!persona || b.personas.includes(persona) || b.personas.includes("ALL")) && (!category || b.categoryTitle === category),
  );

  const href = (next: { persona?: Persona | null; category?: string | null }) => {
    const q = new URLSearchParams();
    const p = next.persona === undefined ? persona : next.persona;
    const c = next.category === undefined ? category : next.category;
    if (p) q.set("persona", p);
    if (c) q.set("category", c);
    const s = q.toString();
    return s ? `/bills?${s}` : "/bills";
  };

  return (
    <Container className="py-10">
      <PageHeader
        title="Хуулийн өөрчлөлт"
        description="Хэлэлцэж буй хуулийн төслүүд. Төсөл бүр юуг өөрчлөх, хэнд хамаарахыг энгийнээр харуулна."
      />

      <div className="mt-6 flex flex-col gap-3">
        <FilterLinks
          label="Танд хамаарах"
          options={[
            { href: href({ persona: null }), text: "Бүгд", active: persona === null },
            ...PERSONAS.filter((p) => p !== "ALL").map((p) => ({ href: href({ persona: p }), text: personaLabels[p], active: persona === p })),
          ]}
        />
        {categories.length > 0 ? (
          <FilterLinks
            label="Ангилал"
            options={[
              { href: href({ category: null }), text: "Бүгд", active: category === null },
              ...categories.map((c) => ({ href: href({ category: c }), text: c, active: category === c })),
            ]}
          />
        ) : null}
      </div>

      <p className="mt-6 text-[14px] text-muted" aria-live="polite">
        {bills.length} төсөл
      </p>

      {bills.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            title="Энэ шүүлтүүрт тохирох төсөл алга"
            description="Өөр бүлэг сонгох эсвэл шүүлтүүрийг арилгана уу."
            action={
              <Link href="/bills" className="font-semibold text-action underline underline-offset-2">
                Бүх төслийг харах
              </Link>
            }
          />
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {bills.map((b) => (
            <li key={b.id}>
              <article className="relative rounded-lg border border-line bg-surface p-5 transition-colors hover:border-primary">
                <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-muted">
                  {b.typeTitle ? <span>{b.typeTitle}</span> : null}
                  {b.categoryTitle ? <Pill>{b.categoryTitle}</Pill> : null}
                  {b.stage ? <Pill tone="action">{stageLabels[b.stage]}</Pill> : null}
                </div>
                <h2 className="mt-2 text-[19px] font-bold leading-snug">
                  <Link href={`/bills/${b.id}`} className="after:absolute after:inset-0">
                    {b.title}
                  </Link>
                </h2>
                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-muted">
                  <div>
                    <dt className="inline">Өөрчлөгдсөн заалт: </dt>
                    <dd className="inline font-semibold tabular-nums text-fg">{b.changedCount}</dd>
                  </div>
                  <div>
                    <dt className="inline">Иргэдийн санал: </dt>
                    <dd className="inline font-semibold tabular-nums text-fg">{b.commentCount}</dd>
                  </div>
                  <div>
                    <dt className="inline">Сүүлд шинэчилсэн: </dt>
                    <dd className="inline tabular-nums">{dateFormat.format(new Date(b.updatedAt))}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex items-center justify-between gap-3">
                  {b.sourceUrl ? (
                    <a
                      href={b.sourceUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="relative z-10 inline-flex items-center gap-1 text-[14px] text-action underline underline-offset-2"
                    >
                      LawForum <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span />
                  )}
                  <ChevronRight aria-hidden className="h-5 w-5 text-muted" />
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
