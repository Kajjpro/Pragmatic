import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { BillCard } from "@/components/bill/bill-card";
import { HeroCard } from "@/components/home/hero-card";
import { SessionPanel } from "@/components/home/session-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteFooter } from "@/components/site/site-footer";

async function loadBillsWithCounts() {
  const bills = await prisma.project
    .findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        categoryTitle: true,
        typeTitle: true,
        projectNumber: true,
        clauses: {
          select: {
            id: true,
            _count: { select: { comments: true } },
          },
        },
      },
    })
    .catch(() => []);

  return bills.map((b) => ({
    id: b.id,
    title: b.title,
    description: b.description,
    categoryTitle: b.categoryTitle,
    typeTitle: b.typeTitle,
    projectNumber: b.projectNumber,
    clauseCount: b.clauses.length,
    commentCount: b.clauses.reduce((a, c) => a + c._count.comments, 0),
  }));
}

export default async function HomePage() {
  const bills = await loadBillsWithCounts();

  return (
    <div className="flex flex-col">
      <section className="bg-white pb-10 pt-6">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <HeroCard />
          <SessionPanel />
        </div>
      </section>

      <section className="bg-parliament-50/40 pb-16 pt-10">
        <div className="mx-auto max-w-[1400px] px-6">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-editorial text-2xl font-medium text-parliament-900">
                Хэлэлцэгдэж буй хуулиуд
              </h2>
              <p className="mt-0.5 text-[12.5px] text-ink-500">
                Заалт бүр дээр саналаа үлдээж, комиссын хариуг «Миний санал»
                хуудсан дээрээ хараарай.
              </p>
            </div>
            <Link
              href="/me"
              className="text-[11.5px] font-semibold text-parliament-700 hover:text-parliament-900"
            >
              Миний санал →
            </Link>
          </div>

          {bills.length === 0 ? (
            <EmptyState
              title="Одоогоор хууль оруулагдаагүй байна"
              description="Ажилтан шинэ хууль оруулмагц энд харагдана."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bills.map((b) => (
                <BillCard key={b.id} {...b} />
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
