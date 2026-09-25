"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/cn";
import { navItems } from "./nav-items";
import { StreakFlame } from "@/components/ui/streak-flame";

// Дээд самбар. Компьютерт үндсэн цэс, гар утсанд зөвхөн лого + оноо.
// points/streak нь нэвтэрсэн хэрэглэгчийнх; Dev 1-ийн GET /api/me бэлэн
// болмогц энд дамжуулна. Одоогоор дамжуулаагүй бол харуулахгүй.
export function TopBar({
  points,
  streak,
}: {
  points?: number;
  streak?: number;
}) {
  const path = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/90 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link
          href="/"
          className="press flex items-center gap-2 rounded-xl"
          aria-label="Хариу — Нүүр"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-[17px] font-extrabold text-white">
            Х
          </span>
          <span className="text-[18px] font-extrabold tracking-tight text-ink-900">
            Хариу
          </span>
        </Link>

        {/* Компьютерийн цэс */}
        <nav aria-label="Үндсэн цэс" className="ml-4 hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const active =
              item.href === "/" ? path === "/" : path.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "press rounded-xl px-3.5 py-2 text-[15px] font-bold transition-colors",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {typeof streak === "number" ? (
            <StreakFlame days={streak} size="sm" />
          ) : null}
          {typeof points === "number" ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-point-100 px-2.5 py-1 text-[13px] font-extrabold tabular-nums text-point-700">
              {points.toLocaleString("mn-MN")} оноо
            </span>
          ) : null}

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="press min-h-10 rounded-xl border-2 border-ink-200 px-3.5 text-[14px] font-bold text-ink-900 hover:border-brand-400 hover:text-brand-700">
                Нэвтрэх
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: { avatarBox: "h-9 w-9 ring-2 ring-brand-200" },
              }}
            />
          </Show>
        </div>
      </div>
    </header>
  );
}
