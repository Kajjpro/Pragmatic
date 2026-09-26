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

const medals = ["🥇", "🥈", "🥉"];

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
        description="Хууль уншиж, асуултад зөв хариулсан, санал хураалтыг зөв таамагласан иргэд. Зөвхөн нэрийн эхний үгийг харуулна."
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
          <ol className="flex flex-col gap-2">
            {rows.map((r) => (
              <Row key={r.userId} row={r} isMe={me?.id === r.userId} />
            ))}
          </ol>
        )}
      </div>
    </Container>
  );
}

function Row({ row, isMe }: { row: LeaderboardRow; isMe: boolean }) {
  return (
    <li
      className={cn(
        "flex items-center gap-4 rounded-xl border bg-surface px-4 py-3",
        isMe ? "border-primary ring-1 ring-primary" : "border-line",
      )}
    >
      <span className="w-9 shrink-0 text-center text-[20px] font-bold tabular-nums text-heading">
        {row.rank <= 3 ? <span aria-label={`${row.rank}-р байр`}>{medals[row.rank - 1]}</span> : row.rank}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16.5px] font-semibold">
          {row.name}
          {isMe ? <span className="ml-2 text-[13px] font-medium text-action">(та)</span> : null}
        </p>
        <p className="text-[13.5px] text-muted">{row.detail}</p>
      </div>
      <span className="shrink-0 text-right">
        <span className="block font-serif text-[22px] font-bold tabular-nums text-heading">{row.score.toLocaleString("mn-MN")}</span>
        <span className="block text-[12px] text-muted">оноо</span>
      </span>
    </li>
  );
}
