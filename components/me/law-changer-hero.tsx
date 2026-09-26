import Link from "next/link";
import { Landmark, Lock } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { ShareButton } from "./share-button";
import { formatDate } from "@/lib/format";
import { POINTS } from "@/lib/points-rules";
import type { Badge } from "@/lib/types";

// "Хууль өөрчилсөн иргэн" — /me-ийн гол хэсэг. Авсан бол тод медаль + батламж; үгүй бол хэрхэн авахыг харуулна.
export function LawChangerHero({ badges }: { badges: Badge[] }) {
  const earned = badges.filter((b) => b.type === "LAW_CHANGER");
  const latest = earned[0];

  if (!latest) {
    return (
      <section className="flex flex-col gap-4 rounded-2xl border border-dashed border-line-strong bg-surface p-5 sm:flex-row sm:items-center sm:p-6">
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-surface-2">
          <Lock aria-hidden className="h-7 w-7 text-muted" />
        </span>
        <div>
          <h2 className="text-[20px] font-bold">«Хууль өөрчилсөн иргэн» тэмдэг</h2>
          <p className="mt-1 text-[15px] text-muted">
            Таны санал хуулийн төсөлд тусгагдвал энэ тэмдэг, иргэний нөлөөний батламж, +{POINTS.REFLECTED} оноо авна.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section
      aria-labelledby="law-changer"
      className="relative overflow-hidden rounded-2xl border border-good/40 bg-surface p-5 shadow-lift sm:p-7"
    >
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_70%_40%,var(--good-bg),transparent_70%)] sm:block" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <span className="relative grid h-20 w-20 shrink-0 place-items-center rounded-full bg-good text-white shadow-card ring-4 ring-good-bg">
          <Landmark aria-hidden className="h-9 w-9" strokeWidth={1.75} />
          {earned.length > 1 ? (
            <span className="absolute -right-1 -top-1 grid h-7 w-7 place-items-center rounded-full bg-gold text-[13px] font-bold">×{earned.length}</span>
          ) : null}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-good-fg">Бодит нөлөө</p>
          <h2 id="law-changer" className="mt-1 text-[24px] font-bold sm:text-[28px]">
            Хууль өөрчилсөн иргэн
          </h2>
          <p className="mt-1 text-[15.5px] text-muted">
            {latest.lawTitle ?? "Хуулийн төсөл"}
            {latest.clauseNumber ? `, ${latest.clauseNumber}-р заалт` : ""} · {formatDate(new Date(latest.createdAt))}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/b/${latest.id}`} className={buttonClass("primary", "sm")}>
              Батламж харах
            </Link>
            <ShareButton url={`/b/${latest.id}`} text="Миний санал хуулийн төсөлд тусгагдлаа — Parlagmatic платформ." className={buttonClass("secondary", "sm")} />
          </div>
        </div>
      </div>
    </section>
  );
}
