import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { firstNameOf } from "@/lib/feed";
import { compareWords } from "@/lib/law/compare";
import { DiffText } from "@/components/law/diff-text";
import { ShareButton } from "@/components/me/share-button";
import { badgeLabels } from "@/lib/types";

// ⑥ Нийтэд нээлттэй тэмдгийн хуудас — нэвтрэх шаардлагагүй.
// Зөвхөн нэрийн эхний үг харагдана (имэйл, бүтэн нэр ХЭЗЭЭ Ч гарахгүй).
//
// Тайлбар: GET /api/badges/[id] нь заалтын өмнө/дараа текстийг буцаадаггүй
// тул энд нэг удаагийн уншилтаар DB-ээс шууд авч байна. Dev 1 PublicBadge-д
// clauseId эсвэл diff нэмбэл энэ асуулга хэрэггүй болно.
async function loadBadge(id: string) {
  return prisma.badge.findUnique({
    where: { id },
    select: {
      id: true,
      type: true,
      createdAt: true,
      user: { select: { name: true } },
      submission: {
        select: {
          clause: {
            select: {
              number: true,
              oldText: true,
              newText: true,
              project: { select: { title: true } },
            },
          },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: PageProps<"/b/[id]">): Promise<Metadata> {
  const { id } = await params;
  const badge = await loadBadge(id).catch(() => null);
  if (!badge) return { title: "Тэмдэг олдсонгүй — Хариу" };

  const label = badgeLabels[badge.type];
  const name = firstNameOf(badge.user.name);
  const law = badge.submission?.clause.project.title;

  const title = `${name} — ${label.title}`;
  const description = law
    ? `${name}-ийн санал «${law}» хуульд тусгагдлаа.`
    : `${name} «${label.title}» тэмдэг авлаа.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      // Dev 1-ийн next/og зураг. Маршрут бэлэн болмогц хуваалцахад зураг гарна.
      images: [{ url: `/api/badges/${id}/image`, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BadgePage({ params }: PageProps<"/b/[id]">) {
  const { id } = await params;
  const badge = await loadBadge(id).catch(() => null);
  if (!badge) notFound();

  const label = badgeLabels[badge.type];
  const name = firstNameOf(badge.user.name);
  const clause = badge.submission?.clause ?? null;
  const diff = clause ? compareWords(clause.oldText, clause.newText) : [];

  return (
    <div className="flex flex-col">
      <section className="chrome-brand relative overflow-hidden text-white">
        <div className="grain" aria-hidden />
        <div className="relative mx-auto max-w-xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <div className="text-[76px] leading-none" aria-hidden>
            {label.emoji}
          </div>
          <p className="mt-3 text-[12.5px] font-extrabold uppercase tracking-[0.18em] text-point-400">
            {label.title}
          </p>
          <h1 className="mt-2 text-[32px] font-extrabold leading-tight tracking-tight sm:text-[40px]">
            {name}
          </h1>

          {clause ? (
            <div className="mt-6 rounded-2xl bg-white/10 p-5 ring-1 ring-white/15">
              <p className="text-[16px] font-semibold leading-relaxed text-white/90">
                {clause.project.title}
              </p>
              <p className="mt-2 font-mono text-[14px] font-bold text-point-400">
                {clause.number} дугаар заалт
              </p>
            </div>
          ) : null}

          <time className="mt-4 block text-[14px] font-semibold text-white/75">
            {badge.createdAt.toISOString().slice(0, 10)}
          </time>
        </div>
      </section>

      {/* Заалт хэрхэн өөрчлөгдсөн */}
      {clause && diff.length > 0 ? (
        <section className="bg-ink-50 py-8">
          <div className="mx-auto max-w-xl px-4 sm:px-6">
            <h2 className="text-[12.5px] font-extrabold uppercase tracking-[0.12em] text-ink-600">
              Заалт хэрхэн өөрчлөгдсөн
            </h2>
            <div className="mt-2.5 rounded-2xl border border-ink-200 bg-white p-4 shadow-soft">
              <DiffText parts={diff} className="text-[15.5px]" />
            </div>
          </div>
        </section>
      ) : null}

      {/* Уриалга */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-xl px-4 text-center sm:px-6">
          <p className="text-[20px] font-extrabold leading-snug tracking-tight text-ink-950">
            Чи ч гэсэн хуулиа өөрчил
          </p>
          <p className="mt-2 text-[15.5px] leading-relaxed text-ink-600">
            Хуулийг 60 секундэд ойлгож, саналаа үлдээ. Санал чинь тусгагдвал
            чамд ч ийм тэмдэг ирнэ.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <Link
              href="/feed"
              className="press inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-600 text-[16.5px] font-extrabold text-white shadow-brand hover:bg-brand-700"
            >
              60 секундэд нэг хууль →
            </Link>
            <ShareButton
              url={`/b/${badge.id}`}
              text={`${name}-ийн санал хуульд тусгагдлаа.`}
              className="press min-h-12 rounded-2xl border-2 border-ink-200 text-[15px] font-bold text-ink-900 hover:border-brand-400 hover:text-brand-700"
            >
              Хуваалцах
            </ShareButton>
          </div>
        </div>
      </section>
    </div>
  );
}
