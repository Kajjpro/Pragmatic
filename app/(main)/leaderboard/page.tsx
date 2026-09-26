import type { Metadata } from "next";
import Link from "next/link";
import { BookOpenText, Trophy, Vote } from "lucide-react";
import { Container, PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { getLeaderboard, type LeaderboardRow, type LeaderboardSection } from "@/lib/leaderboard";
import { POINTS } from "@/lib/points-rules";

export const metadata: Metadata = {
  title: "Тэргүүлэгчид",
  description: "Өнөөдрийн хууль ба Таамаг хэсэгт хамгийн их оноо авсан иргэд.",
};

// Оноо байнга өөрчлөгддөг тул хүсэлт бүрт шинээр уншина
export const dynamic = "force-dynamic";

const tabs: { key: LeaderboardSection; label: string; icon: typeof Trophy; rule: string; empty: string; href: string; cta: string }[] = [
  {
    key: "feed",
    label: "Өнөөдрийн хууль",
    icon: BookOpenText,
    rule: `Асуултад анхны оролдлогоор зөв хариулбал +${POINTS.QUIZ_CORRECT}, тэр картыг уншсаны +${POINTS.CARD_VIEW}. Зөвхөн гүйлгэхэд оноо өгөхгүй.`,
    empty: "Одоогоор хэн ч асуултад хариулаагүй байна. Эхний тэргүүлэгч нь та болоорой.",
    href: "/feed",
    cta: "Хууль унших",
  },
  {
    key: "predict",
    label: "Таамаг",
    icon: Vote,
    rule: "Батлагдах эсэхийг зөв таавал +10, дэмжих гишүүдийн тоог ойртуулбал +2…+10. Оноо дүн гарсны дараа бодогдоно.",
    empty: "Одоогоор хэн ч таамаглаагүй байна. Эхний таамгаа өгөөрэй.",
    href: "/predict",
    cta: "Таамаглах",
  },
];

export default async function LeaderboardPage({ searchParams }: PageProps<"/leaderboard">) {
  const { tab } = await searchParams;
  const current = tabs.find((t) => t.key === tab) ?? tabs[0];

  const [rows, me] = await Promise.all([
    getLeaderboard(current.key).catch((error: unknown) => {
      console.error("Тэргүүлэгчдийг уншиж чадсангүй:", error instanceof Error ? error.message : error);
      return null;
    }),
    getUser().catch(() => null),
  ]);

  return (
    <Container className="py-8">
      <PageHeader
        eyebrow="Хэсэг бүрээр"
        title="Тэргүүлэгчид"
        description="Хууль уншиж, асуултад зөв хариулсан, санал хураалтыг зөв таамагласан иргэд. Нэрийг «Нэр О.» хэлбэрээр харуулна."
      />

      <nav aria-label="Хэсэг" className="mt-6 flex gap-2">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/leaderboard?tab=${t.key}`}
            aria-current={t.key === current.key ? "page" : undefined}
            className={cn(
              "inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-[15px] font-semibold",
              t.key === current.key ? "border-primary bg-primary text-white" : "border-line bg-surface text-fg hover:border-primary",
            )}
          >
            <t.icon aria-hidden className="h-4 w-4" /> {t.label}
          </Link>
        ))}
      </nav>
      <p className="mt-3 text-[14px] text-muted">{current.rule}</p>

      <div className="mt-6">
        {rows === null ? (
          <EmptyState title="Тэргүүлэгчдийг ачаалж чадсангүй" description="Түр хүлээгээд хуудсаа дахин ачаална уу." />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="Тэргүүлэгч алга"
            description={current.empty}
            action={
              <Link href={current.href} className={buttonClass("primary")}>
                {current.cta}
              </Link>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#161b26] p-2 shadow-lift sm:p-4">
            <ol className="flex flex-col">
              {rows.map((r) => (
                <Row key={r.userId} row={r} isMe={me?.id === r.userId} />
              ))}
            </ol>
          </div>
        )}
      </div>
    </Container>
  );
}

// Эхний гурван байрын дугуй: алт, мөнгө, хүрэл
const rankCircle = ["bg-[#f5a524] text-white", "bg-[#6b7489] text-white", "bg-[#c97a3d] text-white"];

function Row({ row, isMe }: { row: LeaderboardRow; isMe: boolean }) {
  const top = row.rank <= 3;
  return (
    <li
      title={row.detail}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-3.5 transition-colors sm:gap-5 sm:px-5 sm:py-4",
        isMe ? "bg-white/[0.07] ring-1 ring-brand-400/60" : "hover:bg-white/[0.03]",
      )}
    >
      <span
        aria-label={`${row.rank}-р байр`}
        className={cn(
          "grid h-10 w-10 shrink-0 place-items-center rounded-full text-[17px] font-bold tabular-nums sm:h-12 sm:w-12 sm:text-[19px]",
          top ? rankCircle[row.rank - 1] : "text-[#8b93a7]",
        )}
      >
        {row.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-medium text-white sm:text-[18px]">
          {row.name}
          {isMe ? <span className="ml-2 rounded-full bg-brand-500/25 px-2 py-0.5 text-[12px] font-semibold text-brand-200">та</span> : null}
        </p>
        <p className="mt-0.5 text-[12.5px] text-[#8b93a7] sm:hidden">
          Lv {row.level} · {row.badges} тэмдэг
        </p>
      </div>
      <span className="hidden w-14 shrink-0 text-right text-[16px] text-[#8b93a7] tabular-nums sm:block">Lv {row.level}</span>
      <span className="hidden w-24 shrink-0 text-right text-[16px] text-[#8b93a7] tabular-nums sm:block">{row.badges} тэмдэг</span>
      <span className="w-24 shrink-0 text-right tabular-nums sm:w-32">
        <span className="text-[17px] font-semibold text-white sm:text-[19px]">{row.score.toLocaleString("en-US")}</span>
        <span className="text-[14px] text-[#8b93a7] sm:text-[16px]"> оноо</span>
      </span>
    </li>
  );
}
