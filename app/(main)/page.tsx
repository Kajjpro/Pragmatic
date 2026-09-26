import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpenText, ExternalLink, Vote } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/page-header";
import { DiffLegend, DiffText } from "@/components/law/diff-text";
import { getPreviewClause } from "@/lib/law/public";
import { getLiveStats } from "@/lib/stats";
import type { WordPart } from "@/lib/law/types";
import { formatDate, formatTime } from "@/lib/format";

export const metadata: Metadata = {
  title: { absolute: "Parlagmatic — Хууль таны амьдралыг өөрчилдөг" },
  description:
    "Улсын Их Хурал хуульд юу өөрчилж байгааг энгийнээр ойлгож, санал хураалтыг дагаж, саналаа өгөх платформ.",
  openGraph: {
    title: "Parlagmatic — Хууль таны амьдралыг өөрчилдөг",
    description: "Хуулийн өөрчлөлтийг энгийнээр ойлгож, санал хураалтыг дагаж, саналаа өгөх платформ.",
  },
};

// Статистик 10 минут тутам шинэчлэгдэнэ (lib/stats.ts)
export const revalidate = 600;

const steps = [
  {
    icon: BookOpenText,
    title: "Өнөөдрийн хууль",
    line: "Нэг өөрчлөлтийг 60 секундэд: өмнө нь ямар байсан, ямар болох, танд юу хамаатай.",
    href: "/feed",
    cta: "Унших",
    tint: "bg-surface-2 text-heading",
  },
  {
    icon: Vote,
    title: "Таамаг",
    line: "Санал хураалтын дүнг урьдчилан таамаглаж, бодит дүнтэй харьцуулна.",
    href: "/predict",
    cta: "Таамаглах",
    tint: "bg-gold-bg text-gold-fg",
  },
  {
    icon: BadgeCheck,
    title: "Би хууль өөрчилсөн",
    line: "Саналаа ирүүлж, Илгээсэн → Хэлэлцэж байна → Тусгагдсан явцыг дагана. Тусгагдвал иргэний нөлөөний батламж авна.",
    href: "/me",
    cta: "Санал ирүүлэх",
    tint: "bg-good-bg text-good-fg",
  },
];


export default async function HomePage() {
  const [stats, preview] = await Promise.all([
    getLiveStats(),
    getPreviewClause().catch(() => null),
  ]);

  const facts = [
    stats.agendaCount !== null && {
      value: stats.agendaCount.toLocaleString("mn-MN"),
      label: "УИХ-ын хэлэлцэх асуудал",
      source: "УИХ, ParliamentAPI",
    },
    stats.draftCount !== null && {
      value: stats.draftCount.toLocaleString("mn-MN"),
      label: "LawForum-д нийтлэгдсэн хуулийн төсөл",
      source: "LawForum",
    },
    stats.lastVoteDate !== null && {
      value: formatDate(new Date(stats.lastVoteDate)),
      label: "Сүүлийн санал хураалт",
      source: "УИХ-ын санал хураалт",
    },
    stats.citizenComments !== null && {
      value: stats.citizenComments.toLocaleString("mn-MN"),
      label: "Иргэдийн өгсөн санал",
      source: "Parlagmatic",
    },
  ]
    .filter((f): f is { value: string; label: string; source: string } => Boolean(f))
    .slice(0, 3);

  return (
    <>
      {/* Нүүр хэсэг */}
      <section className="border-b border-line bg-gradient-to-b from-brand-50 via-surface to-surface">
        <Container className="py-14 sm:py-20">
          <h1 className="max-w-3xl text-[32px] font-bold leading-tight sm:text-[44px]">
            Хууль таны амьдралыг өөрчилдөг. Та түүнийг мэдэх үү?
          </h1>
          <p className="mt-4 max-w-2xl text-[18px] text-muted">
            Улсын Их Хурал хуульд юу өөрчилж байгааг энгийн үгээр уншиж, санал хураалтыг дагаж, саналаа хэлэлцүүлэгт илгээнэ үү.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/feed" className={buttonClass("primary", "lg")}>
              Өнөөдрийн хуулийг унших
            </Link>
            <Link href="/predict" className={buttonClass("secondary", "lg")}>
              Санал хураалтыг таамаглах
            </Link>
          </div>

          {facts.length > 0 ? (
            <div className="mt-12">
              <dl className="grid gap-px overflow-hidden rounded-lg border border-line bg-line sm:grid-cols-3">
                {facts.map((f) => (
                  <div key={f.label} className="bg-surface px-5 py-4">
                    <dt className="text-[14px] text-muted">{f.label}</dt>
                    <dd className="mt-1 font-serif text-[26px] font-bold tabular-nums text-heading">{f.value}</dd>
                    <dd className="mt-1 text-[12.5px] text-muted">Эх сурвалж: {f.source}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-2 text-[12.5px] text-muted">
                Сүүлд шинэчилсэн: {formatTime(new Date(stats.updatedAt))} (10 минут тутам шинэчлэгдэнэ)
              </p>
            </div>
          ) : null}
        </Container>
      </section>

      {/* Хэрхэн ажилладаг вэ */}
      <section>
        <Container className="py-14">
          <h2 className="text-[26px] font-bold">Хэрхэн ажилладаг вэ</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="group flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-card transition-[border-color,box-shadow] hover:border-primary hover:shadow-lift"
              >
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${s.tint}`}>
                  <s.icon aria-hidden className="h-5 w-5" strokeWidth={2} />
                </span>
                <h3 className="mt-3 text-[19px] font-bold">{s.title}</h3>
                <p className="mt-1.5 flex-1 text-[15.5px] text-muted">{s.line}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-[15px] font-semibold text-action">
                  {s.cta} <ArrowRight aria-hidden className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      {/* УИХ-ын сүүлийн санал хураалтууд — зөвхөн тоо (төвийг сахина) */}
      {stats.recentVotes.length > 0 ? (
        <section className="border-t border-line bg-surface">
          <Container className="py-14">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-[26px] font-bold">УИХ сүүлд юуг баталсан бэ</h2>
                <p className="mt-2 max-w-2xl text-muted">Эцсийн санал хураалтын бодит дүн. Эх сурвалж: УИХ-ын санал хураалт.</p>
              </div>
              <Link href="/predict" className="inline-flex items-center gap-1 text-[15px] font-semibold text-action">
                Дүнг таамаглаж тоглох <ArrowRight aria-hidden className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {stats.recentVotes.map((a) => {
                const v = a.finalVote!;
                const supportPct = v.total > 0 ? Math.round((v.support / v.total) * 100) : 0;
                return (
                  <article key={a.agendaCode} className="flex flex-col rounded-2xl border border-line bg-page p-5">
                    {v.votedAt ? <p className="text-[13px] text-muted">{formatDate(new Date(v.votedAt))}</p> : null}
                    <h3 className="mt-1 line-clamp-3 flex-1 text-[16.5px] font-bold leading-snug">{a.title}</h3>
                    <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                      <div className="h-full bg-primary" style={{ width: `${supportPct}%` }} />
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-[14px]">
                      <div>
                        <dt className="text-muted">Дэмжсэн</dt>
                        <dd className="font-semibold tabular-nums text-heading">{v.support}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Татгалзсан</dt>
                        <dd className="font-semibold tabular-nums text-heading">{v.oppose}</dd>
                      </div>
                      <div>
                        <dt className="text-muted">Нийт</dt>
                        <dd className="font-semibold tabular-nums text-heading">{v.total}</dd>
                      </div>
                    </dl>
                  </article>
                );
              })}
            </div>
          </Container>
        </section>
      ) : null}

      {/* LawForum-д сүүлд нийтлэгдсэн төслүүд */}
      {stats.recentDrafts.length > 0 ? (
        <section className="border-t border-line">
          <Container className="py-14">
            <h2 className="text-[26px] font-bold">Сүүлд нийтлэгдсэн хуулийн төслүүд</h2>
            <p className="mt-2 max-w-2xl text-muted">УИХ-ын LawForum сайтад нийтлэгдсэн төслүүд. Дарж эх баримтыг нь үзнэ үү.</p>
            <ul className="mt-6 flex flex-col gap-3">
              {stats.recentDrafts.map((d) => (
                <li key={d.id}>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-start justify-between gap-4 rounded-xl border border-line bg-surface p-4 hover:border-primary"
                  >
                    <div>
                      <p className="text-[16px] font-semibold leading-snug">{d.title}</p>
                      <p className="mt-1 text-[13.5px] text-muted">
                        {[d.categoryTitle, d.publishedAt ? formatDate(new Date(d.publishedAt)) : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                    <ExternalLink aria-hidden className="mt-1 h-4 w-4 shrink-0 text-muted" />
                  </a>
                </li>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* Бодит харьцуулалтын жишээ */}
      {preview ? (
        <section className="border-t border-line bg-surface">
          <Container className="py-14">
            <h2 className="text-[26px] font-bold">Өөрчлөлтийг үг бүрээр нь</h2>
            <p className="mt-2 max-w-2xl text-muted">
              Хуулийн төсөл одоогийн хуулийн аль үгийг хасаж, юу нэмж байгааг автоматаар тодруулна.
            </p>
            <article className="mt-6 rounded-lg border border-line p-5">
              <p className="text-[14px] text-muted">
                {preview.project.title} · {preview.number}-р заалт
              </p>
              <DiffText parts={preview.diff as unknown as WordPart[]} className="mt-2" />
              {preview.what ? <p className="mt-3 border-t border-line pt-3 text-[15.5px] text-fg">{preview.what}</p> : null}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <DiffLegend />
                <Link
                  href={`/bills/${preview.project.id}#clause-${preview.number}`}
                  className="inline-flex items-center gap-1 text-[15px] font-semibold text-action"
                >
                  Бүтэн харьцуулалтыг харах <ArrowRight aria-hidden className="h-4 w-4" />
                </Link>
              </div>
            </article>
          </Container>
        </section>
      ) : null}
    </>
  );
}
