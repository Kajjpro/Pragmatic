import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ExternalLink, Search } from "lucide-react";
import { Container, PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterLinks } from "@/components/ui/filter-links";
import { Pill } from "@/components/ui/pill";
import { buttonClass } from "@/components/ui/button";
import { getPublicBills } from "@/lib/law/public";
import { ensureProjectsFresh } from "@/lib/lawforum-sync";
import { stageLabels } from "@/lib/labels";
import { formatShortDate } from "@/lib/format";
import { PERSONAS, personaLabels, type Persona } from "@/lib/types";

export const metadata: Metadata = {
  title: "Хуулийн өөрчлөлт",
  description: "LawForum дээр нийтлэгдсэн хуулийн төслүүд: юу өөрчлөгдөх, хэнд хамаарах, иргэдийн санал.",
};

const PAGE_SIZE = 20;

// Анх удаа LawForum-оос татах үед хугацаа хэрэгтэй (Vercel)
export const maxDuration = 60;

export default async function BillsPage({ searchParams }: PageProps<"/bills">) {
  const params = await searchParams;
  const persona = PERSONAS.find((p) => p === params.persona) ?? null;
  const category = typeof params.category === "string" ? params.category : null;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const page = Math.max(1, Number(params.page) || 1);

  // LawForum-ын төслүүд DB-д байхгүй эсвэл хуучирсан бол автоматаар татна
  const freshness = await ensureProjectsFresh().catch(() => "lawforum-unreachable" as const);
  const all = await getPublicBills();
  const categories = Array.from(new Set(all.map((b) => b.categoryTitle).filter((c): c is string => Boolean(c)))).sort();

  // Шүүлт: нэрээр хайх, ангилал, "танд хамаарах" (зөвхөн задлан шинжилсэн төсөлд хамаарал тодорхой)
  // Монгол үгийн төгсгөл хувирдаг ("сургууль" → "сургуулийн") тул урт үгийг язгуураар нь тулгана.
  const stems = q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (w.length > 5 ? w.slice(0, -2) : w));
  const filtered = all.filter(
    (b) =>
      stems.every((stem) => b.title.toLowerCase().includes(stem)) &&
      (!category || b.categoryTitle === category) &&
      (!persona || b.personas.includes(persona) || b.personas.includes("ALL")),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const bills = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const href = (next: { persona?: Persona | null; category?: string | null; page?: number }) => {
    const query = new URLSearchParams();
    const p = next.persona === undefined ? persona : next.persona;
    const c = next.category === undefined ? category : next.category;
    if (q) query.set("q", q);
    if (p) query.set("persona", p);
    if (c) query.set("category", c);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    const s = query.toString();
    return s ? `/bills?${s}` : "/bills";
  };

  return (
    <Container className="py-10">
      <PageHeader
        title="Хуулийн өөрчлөлт"
        description="LawForum дээр нийтлэгдсэн хуулийн төслүүд. Задлан шинжилсэн төслүүдэд заалт бүрийн харьцуулалт, энгийн тайлбар бий."
      />

      <div className="mt-6 flex flex-col gap-3">
        <form action="/bills" className="flex max-w-xl gap-2" role="search">
          {persona ? <input type="hidden" name="persona" value={persona} /> : null}
          {category ? <input type="hidden" name="category" value={category} /> : null}
          <label htmlFor="bill-search" className="sr-only">
            Төслийн нэрээр хайх
          </label>
          <input
            id="bill-search"
            name="q"
            defaultValue={q}
            placeholder="Төслийн нэрээр хайх"
            className="min-h-11 flex-1 rounded-lg border border-line-strong bg-surface px-3 text-[15.5px] placeholder:text-muted focus:border-action focus:outline-none"
          />
          <button type="submit" className={buttonClass("secondary")}>
            <Search aria-hidden className="h-4 w-4" /> Хайх
          </button>
        </form>
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
        {filtered.length} төсөл{persona ? " (хамаарал нь тодорхойлогдсон төслүүдээс)" : ""}
      </p>

      {bills.length === 0 ? (
        <div className="mt-3">
          <EmptyState
            title={all.length === 0 ? "Төсөл хараахан татагдаагүй байна" : "Энэ хайлт, шүүлтүүрт тохирох төсөл алга"}
            description={
              all.length === 0
                ? freshness === "lawforum-unreachable"
                  ? "LawForum-тай одоогоор холбогдож чадсангүй. Хэсэг хугацааны дараа хуудсаа дахин ачаална уу."
                  : "LawForum-оос төслүүдийг татсаны дараа энд харагдана."
                : "Өөр үг, бүлэг эсвэл ангилал сонгоно уу."
            }
            action={
              all.length === 0 ? undefined : (
                <Link href="/bills" className="font-semibold text-action underline underline-offset-2">
                  Бүх төслийг харах
                </Link>
              )
            }
          />
        </div>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {bills.map((b) => (
            <li key={b.id}>
              <article className="relative rounded-lg border border-line bg-surface p-5 transition-colors hover:border-primary">
                <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-muted">
                  {b.changedCount > 0 ? <Pill tone="good">Заалтын харьцуулалттай</Pill> : null}
                  {b.hasCard ? <Pill tone="action">Энгийн тайлбартай</Pill> : null}
                  {b.stage ? <Pill>{stageLabels[b.stage]}</Pill> : null}
                  {b.categoryTitle ? <span>{b.categoryTitle}</span> : null}
                  {b.typeTitle ? <span>· {b.typeTitle}</span> : null}
                </div>
                <h2 className="mt-2 text-[19px] font-bold leading-snug">
                  <Link href={`/bills/${b.id}`} className="after:absolute after:inset-0">
                    {b.title}
                  </Link>
                </h2>
                {b.summary ? <p className="mt-2 text-[15px] text-muted">{b.summary}</p> : null}
                <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[14px] text-muted">
                  {b.publishedAt ? (
                    <div>
                      <dt className="inline">Нийтэлсэн: </dt>
                      <dd className="inline tabular-nums">{formatShortDate(b.publishedAt)}</dd>
                    </div>
                  ) : null}
                  {b.changedCount > 0 ? (
                    <div>
                      <dt className="inline">Өөрчлөгдсөн заалт: </dt>
                      <dd className="inline font-semibold tabular-nums text-fg">{b.changedCount}</dd>
                    </div>
                  ) : null}
                  {b.lawforumComments !== null ? (
                    <div>
                      <dt className="inline">LawForum-ын сэтгэгдэл: </dt>
                      <dd className="inline font-semibold tabular-nums text-fg">{b.lawforumComments}</dd>
                    </div>
                  ) : null}
                  {b.commentCount > 0 ? (
                    <div>
                      <dt className="inline">Хариу-ийн санал: </dt>
                      <dd className="inline font-semibold tabular-nums text-fg">{b.commentCount}</dd>
                    </div>
                  ) : null}
                </dl>
                {b.sourceUrl ? (
                  <a
                    href={b.sourceUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="relative z-10 mt-3 inline-flex items-center gap-1 text-[14px] text-action underline underline-offset-2"
                  >
                    LawForum <ExternalLink aria-hidden className="h-3.5 w-3.5" />
                  </a>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <nav aria-label="Хуудаслалт" className="mt-6 flex items-center justify-between gap-3">
          {current > 1 ? (
            <Link href={href({ page: current - 1 })} className={buttonClass("secondary")}>
              <ChevronLeft aria-hidden className="h-4 w-4" /> Өмнөх
            </Link>
          ) : (
            <span />
          )}
          <span className="text-[14px] tabular-nums text-muted">
            {current} / {pageCount}
          </span>
          {current < pageCount ? (
            <Link href={href({ page: current + 1 })} className={buttonClass("secondary")}>
              Дараах <ChevronRight aria-hidden className="h-4 w-4" />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </Container>
  );
}
