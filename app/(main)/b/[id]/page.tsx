import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { firstNameOf } from "@/lib/feed";
import { compareWords } from "@/lib/law/compare";
import { DiffText } from "@/components/law/diff-text";
import { CertificateShare } from "@/components/me/certificate-share";
import { BadgeIcon } from "@/components/me/badge-icon";
import { Container } from "@/components/ui/page-header";
import { buttonClass } from "@/components/ui/button";
import { badgeLabels } from "@/lib/types";
import { formatDate, formatShortDate } from "@/lib/format";

// ⑥ Нийтэд нээлттэй иргэний нөлөөний батламж — нэвтрэх шаардлагагүй.
// Зөвхөн нэрийн эхний үг харагдана (имэйл, бүтэн нэр хэзээ ч гарахгүй).
async function loadBadge(id: string) {
  return prisma.badge.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      createdAt: true,
      user: { select: { name: true } },
      submission: {
        select: { clause: { select: { number: true, oldText: true, newText: true, project: { select: { id: true, title: true } } } } },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps<"/b/[id]">): Promise<Metadata> {
  const { id } = await params;
  const badge = await loadBadge(id).catch(() => null);
  if (!badge) return { title: "Батламж олдсонгүй" };

  const label = badgeLabels[badge.type].title;
  const name = firstNameOf(badge.user.name);
  const law = badge.submission?.clause.project.title;
  const title = `${name} — ${label}`;
  const description = law ? `${name}-ийн санал «${law}» төсөлд тусгагдсан.` : `${name} «${label}» тэмдэг авсан.`;
  const image = `/api/badges/${badge.id}/image`;

  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: image, width: 1200, height: 630, alt: `${label} — ${name}` }] },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

// Платформын тамга (төрийн тамга биш) — "ТУСГАГДСАН"
function Stamp({ date }: { date: string }) {
  return (
    <svg viewBox="0 0 200 200" className="h-28 w-28 -rotate-12 text-good opacity-90 sm:h-32 sm:w-32" role="img" aria-label="Parlagmatic платформын тамга: Тусгагдсан">
      <defs>
        <path id="stamp-ring" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
      </defs>
      <circle cx="100" cy="100" r="94" fill="none" stroke="currentColor" strokeWidth="4" />
      <circle cx="100" cy="100" r="86" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="56" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text fill="currentColor" fontSize="14" fontWeight="700" letterSpacing="3" fontFamily="var(--font-inter), sans-serif">
        <textPath href="#stamp-ring" textLength="440" lengthAdjust="spacing">
          ХАРИУ • ИРГЭНИЙ ОРОЛЦОО • ХАРИУ • ИРГЭНИЙ ОРОЛЦОО •
        </textPath>
      </text>
      <text x="100" y="99" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="700" fontFamily="var(--font-inter), sans-serif">
        ТУСГАГДСАН
      </text>
      <text x="100" y="120" textAnchor="middle" fill="currentColor" fontSize="13" fontFamily="var(--font-inter), sans-serif">
        {date}
      </text>
    </svg>
  );
}

export default async function BadgePage({ params }: PageProps<"/b/[id]">) {
  const { id } = await params;
  const badge = await loadBadge(id);
  if (!badge) notFound();

  const label = badgeLabels[badge.type].title;
  const name = firstNameOf(badge.user.name);
  const clause = badge.submission?.clause ?? null;
  const diff = clause && (clause.oldText || clause.newText) ? compareWords(clause.oldText, clause.newText) : null;
  const isImpact = badge.type === "LAW_CHANGER";
  const date = formatDate(badge.createdAt);
  const serial = `Х-${badge.createdAt.getUTCFullYear()}-${badge.id.slice(-6).toUpperCase()}`;

  return (
    <Container className="max-w-4xl py-10">
      <article className="rounded-2xl bg-surface p-2 shadow-lift sm:p-3">
        {/* Хүрээ: давхар шугам + нарийн хээ */}
        <div className="rounded-xl border-2 border-primary p-1.5">
          <div
            className="relative rounded-lg border border-line-strong px-5 py-10 text-center sm:px-14 sm:py-14"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, rgb(17 24 39 / 0.018) 0 2px, transparent 2px 9px), repeating-linear-gradient(-45deg, rgb(17 24 39 / 0.018) 0 2px, transparent 2px 9px)",
            }}
          >
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.28em] text-muted">Parlagmatic · Иргэний оролцооны платформ</p>
            <h1 className="mt-4 text-[26px] font-bold uppercase tracking-[0.06em] sm:text-[38px]">
              {isImpact ? "Иргэний нөлөөний батламж" : "Оролцооны тэмдэг"}
            </h1>
            <div aria-hidden className="mx-auto mt-4 flex items-center justify-center gap-3">
              <span className="h-px w-16 bg-line-strong" />
              <BadgeIcon type={badge.type} className="h-6 w-6" />
              <span className="h-px w-16 bg-line-strong" />
            </div>
            <p className="mt-5 text-[15px] text-muted">Энэхүү {isImpact ? "батламжийг" : "тэмдгийг"}</p>
            <p className="mt-2 font-serif text-[34px] font-bold text-heading sm:text-[42px]">{name}</p>
            <p className="mt-1 text-[15px] font-semibold uppercase tracking-[0.12em] text-good-fg">{label}</p>
            {clause ? (
              <p className="mx-auto mt-5 max-w-xl text-[16.5px] leading-relaxed">
                иргэний ирүүлсэн санал «{clause.project.title}» төслийн <b>{clause.number}-р заалтад</b> тусгагдсаныг баталгаажуулав.
              </p>
            ) : (
              <p className="mx-auto mt-5 max-w-xl text-[16.5px]">иргэнд олгов.</p>
            )}

            {diff ? (
              <div className="mx-auto mt-8 max-w-xl rounded-xl border border-line bg-surface p-4 text-left">
                <p className="text-[12.5px] font-semibold uppercase tracking-wide text-muted">Заалтын өөрчлөлт</p>
                <DiffText parts={diff} className="mt-2 text-[15px]" />
              </div>
            ) : null}

            <div className="mt-10 flex flex-col items-center justify-between gap-6 border-t border-line pt-6 text-left sm:flex-row sm:items-end">
              <dl className="grid gap-1 text-[14px]">
                <div>
                  <dt className="inline text-muted">Олгосон огноо: </dt>
                  <dd className="inline font-semibold tabular-nums">{date}</dd>
                </div>
                <div>
                  <dt className="inline text-muted">Батламжийн дугаар: </dt>
                  <dd className="inline font-semibold tabular-nums">{serial}</dd>
                </div>
                <div>
                  <dt className="inline text-muted">Олгосон: </dt>
                  <dd className="inline font-semibold">Parlagmatic платформ</dd>
                </div>
              </dl>
              {isImpact ? <Stamp date={formatShortDate(badge.createdAt)} /> : null}
            </div>
            <p className="mt-6 text-[12.5px] text-muted">
              Энэ нь Parlagmatic платформын иргэний оролцооны батламж бөгөөд төрийн албан ёсны баримт бичиг биш. Тусгасан эсэхийг УИХ-ын ажлын албаны хариунд үндэслэв.
            </p>
          </div>
        </div>
      </article>

      <div className="mt-6">
        <CertificateShare
          url={new URL(`/b/${badge.id}`, process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").href}
          path={`/b/${badge.id}`}
          imagePath={`/api/badges/${badge.id}/image`}
          text={`${name} «${label}» батламж авлаа — Parlagmatic платформ.`}
        />
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {clause ? (
          <Link href={`/bills/${clause.project.id}#clause-${clause.number}`} className={buttonClass("ghost", "sm")}>
            Заалтыг харах
          </Link>
        ) : null}
        <Link href="/me" className={buttonClass("ghost", "sm")}>
          Та ч санал ирүүлэх боломжтой
        </Link>
      </div>
    </Container>
  );
}
