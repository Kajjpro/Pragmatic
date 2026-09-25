"use client";

import { useEffect, useState } from "react";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { useMe } from "@/components/shell/me-context";
import { BadgeRow } from "@/components/me/badge-row";
import { BadgeUnlock } from "@/components/me/badge-unlock";
import { MyComments } from "@/components/me/my-comments";
import { MyPredictions } from "@/components/me/my-predictions";
import { StreakFlame } from "@/components/ui/streak-flame";
import { Skeleton } from "@/components/ui/skeleton";
import { personaLabels, type Badge } from "@/lib/types";
import { cn } from "@/lib/cn";

// Аль тэмдгийг аль хэдийн үзүүлснийг төхөөрөмж дээрээ санана —
// нээлтийн мөч нэг л удаа гарна.
const SEEN_BADGES = "hariu.seenBadges.v1";

function readSeenBadges(): string[] {
  try {
    return JSON.parse(localStorage.getItem(SEEN_BADGES) ?? "[]") as string[];
  } catch {
    return [];
  }
}

type Tab = "comments" | "predictions";

export default function MePage() {
  const { me, loaded } = useMe();
  const [tab, setTab] = useState<Tab>("comments");
  const [seen, setSeen] = useState<string[] | null>(null);
  const [dismissed, setDismissed] = useState<string[]>([]); // энэ сессэд хаасан
  const [manual, setManual] = useState<Badge | null>(null); // мөрнөөс дарж нээсэн

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage бол гаднын сан; зөвхөн холбогдсоны дараа уншина
    setSeen(readSeenBadges());
  }, []);

  // Шинэ "Хууль өөрчилсөн иргэн" тэмдэг — effect-гүй, шууд тооцно
  const pending =
    me && seen
      ? (me.badges.find(
          (b) =>
            b.type === "LAW_CHANGER" &&
            !seen.includes(b.id) &&
            !dismissed.includes(b.id),
        ) ?? null)
      : null;
  const unlock = manual ?? pending;

  // Хаахад: гараар нээсэн бол зүгээр хаана; шинэ тэмдэг бол "үзсэн" болгоно
  function closeUnlock() {
    if (manual) {
      setManual(null);
      return;
    }
    if (!pending) return;
    setDismissed((d) => [...d, pending.id]);
    const ids = Array.from(new Set([...(seen ?? []), pending.id]));
    setSeen(ids);
    try {
      localStorage.setItem(SEEN_BADGES, JSON.stringify(ids));
    } catch {
      // Хаалттай горимд хадгалахгүй — дараагийн удаа дахин гарч магадгүй
    }
  }

  if (!loaded) return <LoadingMe />;
  if (!me) return <SignInPrompt />;

  const displayName = me.name || "Иргэн";
  const initial = (displayName.trim()[0] ?? "?").toUpperCase();
  const comments = me.comments ?? [];
  const predictions = me.predictions ?? [];

  return (
    <div className="flex flex-col">
      {/* Толгой */}
      <section className="chrome-brand relative overflow-hidden text-white">
        <div className="grain" aria-hidden />
        <div className="relative mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-10">
          <div className="flex flex-wrap items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-point-400 text-[24px] font-extrabold text-ink-950 ring-4 ring-white/15">
              {initial}
            </div>
            <div className="min-w-0">
              <h1 className="text-[26px] font-extrabold leading-tight tracking-tight sm:text-[30px]">
                {displayName}
              </h1>
              <span className="mt-1.5 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[13px] font-bold ring-1 ring-white/20">
                {personaLabels[me.persona]}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-point-400 px-5 py-3 text-ink-950">
              <div className="text-[34px] font-extrabold leading-none tabular-nums">
                {me.points.toLocaleString("mn-MN")}
              </div>
              <div className="mt-0.5 text-[12.5px] font-bold text-ink-950/75">оноо</div>
            </div>
            <StreakFlame days={me.streak} />
          </div>

          <div className="mt-6">
            <h2 className="mb-2.5 text-[12.5px] font-extrabold uppercase tracking-[0.14em] text-point-400">
              Тэмдгүүд
            </h2>
            <BadgeRow badges={me.badges} onOpen={setManual} />
          </div>
        </div>
      </section>

      {/* Табууд */}
      <div className="sticky top-16 z-20 border-b border-ink-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl gap-1 px-4 sm:px-6">
          {[
            { key: "comments" as const, label: "Миний санал", n: comments.length },
            { key: "predictions" as const, label: "Таамгууд", n: predictions.length },
          ].map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-current={tab === t.key ? "page" : undefined}
              className={cn(
                "press relative flex min-h-12 items-center gap-1.5 px-4 text-[15px] font-extrabold",
                tab === t.key ? "text-brand-700" : "text-ink-600 hover:text-ink-900",
              )}
            >
              {t.label}
              <span className="rounded-full bg-ink-100 px-1.5 text-[12px] tabular-nums text-ink-700">
                {t.n}
              </span>
              {tab === t.key ? (
                <span className="absolute inset-x-3 bottom-0 h-[3px] rounded-full bg-brand-600" />
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <section className="mx-auto w-full max-w-2xl px-4 py-6 sm:px-6">
        {tab === "comments" ? (
          <MyComments comments={comments} />
        ) : (
          <MyPredictions rows={predictions} />
        )}
      </section>

      <BadgeUnlock badge={unlock} onClose={closeUnlock} />
    </div>
  );
}

function LoadingMe() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6" aria-busy="true">
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-2xl" />
        <div className="flex-1">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="mt-2 h-5 w-24 rounded-full" />
        </div>
      </div>
      <Skeleton className="mt-6 h-20 w-40 rounded-2xl" />
      <Skeleton className="mt-6 h-16 w-full rounded-2xl" />
      <Skeleton className="mt-6 h-40 w-full rounded-3xl" />
      <span className="sr-only">Ачаалж байна…</span>
    </div>
  );
}

function SignInPrompt() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-md rounded-3xl border border-ink-200 bg-white p-8 text-center shadow-card">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-[30px]">
          <span aria-hidden>🏛️</span>
        </div>
        <h1 className="mt-4 text-[24px] font-extrabold tracking-tight text-ink-950">
          Би
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-600">
          Нэвтэрвэл оноо, streak, тэмдгүүд, өгсөн санал, таамаг чинь энд хадгалагдана.
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <SignInButton mode="modal">
            <button className="press min-h-14 w-full rounded-2xl bg-brand-600 text-[16px] font-extrabold text-white shadow-brand hover:bg-brand-700">
              Google-ээр нэвтрэх
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="press min-h-12 w-full rounded-2xl border-2 border-ink-200 text-[15px] font-bold text-ink-900 hover:border-brand-400 hover:text-brand-700">
              Бүртгүүлэх
            </button>
          </SignUpButton>
        </div>
      </div>
    </div>
  );
}
