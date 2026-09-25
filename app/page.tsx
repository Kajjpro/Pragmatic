import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBillList } from "@/lib/law/queries";
import { BillCard } from "@/components/bill/bill-card";
import { HeroCard, type HeroStats } from "@/components/home/hero-card";
import { EmptyState } from "@/components/ui/empty-state";
import { SiteFooter } from "@/components/site/site-footer";

// Нүүр хуудсанд харуулах бодит тоонууд — бүгд DB-ээс.
async function loadStats(): Promise<HeroStats> {
  const [changedClauses, comments, filtered, groups] = await Promise.all([
    prisma.clause.count({ where: { changeType: { not: "UNCHANGED" } } }),
    prisma.comment.count({
      where: { OR: [{ filterStatus: null }, { filterStatus: "RELEVANT" }] },
    }),
    prisma.comment.count({
      where: {
        filterStatus: { in: ["OFF_TOPIC", "ABUSIVE", "DUPLICATE"] },
        restored: false,
      },
    }),
    prisma.cluster.count(),
  ]);
  return { changedClauses, comments, filtered, groups };
}

export default async function HomePage() {
  // Иргэний жагсаалт: зөвхөн батлагдсан өөрчлөлт бүхий төслүүд (тасарсан линк гарахгүй)
  const [bills, stats] = await Promise.all([
    getBillList(false).catch(() => []),
    loadStats().catch(() => ({
      changedClauses: 0,
      comments: 0,
      filtered: 0,
      groups: 0,
    })),
  ]);

  return (
    <div className="flex flex-col">
      <section className="bg-white pb-8 pt-5 sm:pb-10 sm:pt-6">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <HeroCard stats={stats} />
        </div>
      </section>

      <section className="bg-parliament-50/40 pb-14 pt-8 sm:pt-10">
        <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-editorial text-xl font-medium text-parliament-900 sm:text-2xl">
                Хэлэлцэгдэж буй хуулийн төслүүд
              </h2>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-500">
                Заалт бүр дээр саналаа үлдээж, хариуг «Миний санал» хуудсан
                дээрээ хараарай.
              </p>
            </div>
            <Link
              href="/me"
              className="inline-flex min-h-11 items-center text-[12px] font-semibold text-parliament-700 hover:text-parliament-900"
            >
              Миний санал →
            </Link>
          </div>

          {bills.length === 0 ? (
            <EmptyState
              title="Одоогоор нээлттэй төсөл байхгүй байна"
              description="Ажилтан төслийн харьцуулалтыг баталмагц энд харагдана."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {bills.map((b) => (
                <BillCard key={b.id} bill={b} />
              ))}
            </div>
          )}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
