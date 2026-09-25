"use client";

import Link from "next/link";
import { StreakFlame } from "@/components/ui/streak-flame";

// Фийдийн төгсгөл: өнөөдрийн хуулиуд дууслаа.
export function FeedEnd({
  streak,
  onRestart,
}: {
  streak: number;
  onRestart: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-ink-200 bg-white p-6 text-center shadow-card">
      <div className="text-[56px] leading-none" aria-hidden>
        ✅
      </div>
      <h2 className="mt-4 text-[24px] font-extrabold leading-tight tracking-tight text-ink-950 sm:text-[28px]">
        Өнөөдрийн хуулиуд дууслаа
      </h2>
      <p className="mt-2 max-w-sm text-[16px] leading-relaxed text-ink-600">
        Маргааш дахин ирээрэй — streak чинь үргэлжилнэ.
      </p>

      <div className="mt-4">
        <StreakFlame days={streak} />
      </div>

      <div className="mt-7 flex w-full max-w-xs flex-col gap-2.5">
        <Link
          href="/predict"
          className="press inline-flex min-h-14 items-center justify-center rounded-2xl bg-brand-600 text-[16.5px] font-extrabold text-white shadow-brand hover:bg-brand-700"
        >
          Одоо таамаглая →
        </Link>
        <button
          type="button"
          onClick={onRestart}
          className="press min-h-12 rounded-2xl bg-ink-100 text-[15px] font-bold text-ink-700 hover:bg-ink-200"
        >
          Эхнээс нь дахин үзэх
        </button>
      </div>
    </div>
  );
}
