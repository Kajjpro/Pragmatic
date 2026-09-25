import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpenText, Vote } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Container } from "@/components/ui/page-header";
import { DiffLegend, DiffText } from "@/components/law/diff-text";
import { getPreviewClause } from "@/lib/law/public";
import { getLiveStats } from "@/lib/stats";
import type { WordPart } from "@/lib/law/types";

export const metadata: Metadata = {
  title: { absolute: "Хариу — Хууль таны амьдралыг өөрчилдөг" },
  description:
    "Улсын Их Хурал хуульд юу өөрчилж байгааг энгийнээр ойлгож, санал хураалтыг дагаж, саналаа өгөх платформ.",
  openGraph: {
    title: "Хариу — Хууль таны амьдралыг өөрчилдөг",
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
  },
  {
    icon: Vote,
    title: "Таамаг",
    line: "Санал хураалтын дүнг урьдчилан таамаглаж, бодит дүнтэй харьцуулна.",
    href: "/predict",
    cta: "Таамаглах",
  },
  {
    icon: BadgeCheck,
    title: "Хууль өөрчилсөн иргэн",
    line: "Таны санал хуульд тусгагдвал бодит нөлөөний гэрчилгээ авна.",
    href: "/me",
    cta: "Миний оролцоо",
  },
];

const dateFormat = new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "long", day: "numeric" });
const timeFormat = new Intl.DateTimeFormat("mn-MN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ulaanbaatar" });

export default async function HomePage() {
  const [stats, preview] = await Promise.all([
    getLiveStats(),
    getPreviewClause().catch(() => null),
  ]);

  const facts = [
    stats.activeProjects !== null && {
      value: stats.activeProjects.toLocaleString("mn-MN"),
      label: "LawForum дээр идэвхтэй төсөл",
      source: "LawForum",
    },
    stats.citizenComments !== null && {
      value: stats.citizenComments.toLocaleString("mn-MN"),
      label: "Иргэдийн өгсөн санал",
      source: "Хариу",
    },
    stats.lastVoteDate !== null && {
      value: dateFormat.format(new Date(stats.lastVoteDate)),
      label: "Сүүлийн санал хураалт",
      source: "УИХ-ын санал хураалт",
    },
  ].filter((f): f is { value: string; label: string; source: string } => Boolean(f));

  return (
    <>
      {/* Нүүр хэсэг */}
      <section className="border-b border-line bg-surface">
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
            <Link href="/bills" className={buttonClass("secondary", "lg")}>
              Хуулийн өөрчлөлтүүдийг харах
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
                Сүүлд шинэчилсэн: {timeFormat.format(new Date(stats.updatedAt))} (10 минут тутам шинэчлэгдэнэ)
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
                className="group flex flex-col rounded-lg border border-line bg-surface p-5 transition-colors hover:border-primary"
              >
                <s.icon aria-hidden className="h-6 w-6 text-heading" strokeWidth={1.75} />
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
