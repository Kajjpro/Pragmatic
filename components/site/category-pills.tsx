"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

const categories = [
  "ЭХЛЭЛ",
  "МЭДЭЭ",
  "ХУРАЛДААНЫ ТОЙМ",
  "ХУРАЛДААНЫ ИРЦ",
  "САНАЛ ХУРААЛТ",
  "ХУУЛИЙН ХУВИЛБАР",
  "ХУРАЛДААНЫ ТЭМДЭГЛЭЛ",
  "АСУУЛТ, АСУУЛГА",
  "ҮНЭЛГЭЭ",
  "СОНСГОЛ",
];

export function CategoryPills() {
  const [active, setActive] = useState(0);
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-x-0 -top-6 h-6 bg-gradient-to-b from-parliament-950/0 to-transparent" />
      <div className="mx-auto max-w-[1400px] px-6">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-ink-100 pb-4">
          {categories.map((label, i) => {
            const isActive = i === active;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActive(i)}
                className={cn(
                  "rounded-full border px-4 py-1.5 text-[11.5px] font-semibold tracking-[0.06em] transition-all duration-200",
                  isActive
                    ? "border-parliament-800 bg-parliament-800 text-white shadow-[0_6px_18px_-8px_rgba(18,50,120,0.65)]"
                    : "border-parliament-100 bg-white text-parliament-800 hover:border-parliament-500 hover:text-parliament-900",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
