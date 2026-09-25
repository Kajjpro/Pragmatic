"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import type { Badge } from "@/lib/types";
import { BadgeIcon } from "./badge-icon";
import { ShareButton } from "./share-button";
import { formatDate } from "@/lib/format";


// Шинэ "Хууль өөрчилсөн иргэн" тэмдэг — тайван, бүтэн өргөнтэй мэдэгдэл (цонх биш).
export function LawChangerNotice({ badge, onClose }: { badge: Badge; onClose: () => void }) {
  return (
    <section
      aria-labelledby="law-changer-title"
      className="relative rounded-lg border border-gold/50 bg-gold-bg p-5 sm:p-6"
    >
      <button type="button" onClick={onClose} aria-label="Мэдэгдлийг хаах" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface">
        <X aria-hidden className="h-5 w-5" />
      </button>
      <div className="flex items-start gap-4">
        <BadgeIcon type="LAW_CHANGER" className="mt-1 h-8 w-8" />
        <div>
          <h2 id="law-changer-title" className="text-[22px] font-bold">
            Таны санал хуульд тусгагдлаа
          </h2>
          <p className="mt-1 text-[16px]">
            Та <b>«Хууль өөрчилсөн иргэн»</b> гэрчилгээ авлаа.
          </p>
          <p className="mt-2 text-[15px] text-muted">
            {badge.lawTitle ?? "Хуулийн төсөл"}
            {badge.clauseNumber ? `, ${badge.clauseNumber}-р заалт` : ""} · {formatDate(new Date(badge.createdAt))}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <ShareButton
              url={`/b/${badge.id}`}
              text="Миний санал хуулийн төсөлд тусгагдлаа — Хариу платформ."
              className={buttonClass("primary", "sm")}
            />
            <Link href={`/b/${badge.id}`} className={buttonClass("secondary", "sm")}>
              Гэрчилгээг харах
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
