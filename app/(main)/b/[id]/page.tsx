import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { firstNameOf } from "@/lib/feed";
import { compareWords } from "@/lib/law/compare";
import { DiffText } from "@/components/law/diff-text";
import { ShareButton } from "@/components/me/share-button";
import { BadgeIcon } from "@/components/me/badge-icon";
import { Container } from "@/components/ui/page-header";
import { buttonClass } from "@/components/ui/button";
import { badgeLabels } from "@/lib/types";

// ⑥ Нийтэд нээлттэй гэрчилгээний хуудас — нэвтрэх шаардлагагүй.
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

const dateFormat = new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Ulaanbaatar" });

export async function generateMetadata({ params }: PageProps<"/b/[id]">): Promise<Metadata> {
  const { id } = await params;
  const badge = await loadBadge(id).catch(() => null);
  if (!badge) return { title: "Гэрчилгээ олдсонгүй" };

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

export default async function BadgePage({ params }: PageProps<"/b/[id]">) {
  const { id } = await params;
  const badge = await loadBadge(id);
  if (!badge) notFound();

  const label = badgeLabels[badge.type].title;
  const name = firstNameOf(badge.user.name);
  const clause = badge.submission?.clause ?? null;
  const diff = clause && (clause.oldText || clause.newText) ? compareWords(clause.oldText, clause.newText) : null;

  return (
    <Container className="max-w-3xl py-10">
      <article className="rounded-lg border border-gold/60 bg-surface p-2 shadow-card">
        <div className="rounded-md border border-line px-6 py-10 text-center sm:px-12">
          <BadgeIcon type={badge.type} className="mx-auto h-10 w-10" />
          <p className="mt-4 text-[14px] uppercase tracking-[0.18em] text-muted">Бодит нөлөөний гэрчилгээ</p>
          <h1 className="mt-3 text-[32px] font-bold sm:text-[40px]">{label}</h1>
          <div aria-hidden className="mx-auto mt-4 h-0.5 w-24 bg-gold" />
          <p className="mt-6 font-serif text-[26px] text-heading">{name}</p>
          {clause ? (
            <p className="mx-auto mt-3 max-w-xl text-[16.5px]">
              Энэ иргэний санал «{clause.project.title}» төслийн {clause.number}-р заалтад тусгагдсан.
            </p>
          ) : null}
          <p className="mt-4 text-[14.5px] tabular-nums text-muted">{dateFormat.format(badge.createdAt)}</p>

          {diff ? (
            <div className="mx-auto mt-8 max-w-xl rounded-md border border-line bg-surface-2 p-4 text-left">
              <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">Заалтын өөрчлөлт</p>
              <DiffText parts={diff} className="mt-2 text-[15px]" />
            </div>
          ) : null}

          <p className="mt-8 text-[14px] text-muted">
            Олгосон: Хариу платформ. Эх сурвалж: иргэний санал, УИХ-ын Тамгын газрын ажлын албаны шийдвэр.
          </p>
        </div>
      </article>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <ShareButton
          url={`/b/${badge.id}`}
          text={`${name} «${label}» гэрчилгээ авлаа — Хариу платформ.`}
          className={buttonClass("secondary")}
        />
        {clause ? (
          <Link href={`/bills/${clause.project.id}#clause-${clause.number}`} className={buttonClass("secondary")}>
            Заалтыг харах
          </Link>
        ) : null}
        <Link href="/bills" className={buttonClass("primary")}>
          Та ч оролцох боломжтой
        </Link>
      </div>
    </Container>
  );
}
