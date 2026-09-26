"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { isActive, navItems } from "./nav-items";

// Гар утас, таблетын доод цэс (компьютерт дээд цэс ажиллана).
export function BottomNav() {
  const path = usePathname() ?? "/";

  return (
    <nav
      aria-label="Үндсэн цэс"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {navItems.filter((item) => !item.desktopOnly).map((item) => {
          const active = isActive(item.href, path);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 pt-2 pb-1.5 text-[11.5px] font-medium",
                  active ? "text-heading" : "text-muted hover:text-fg",
                )}
                style={{ minHeight: "var(--bottom-nav-h)" }}
              >
                <Icon aria-hidden className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                <span className={cn(active && "font-semibold")}>{item.short}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
