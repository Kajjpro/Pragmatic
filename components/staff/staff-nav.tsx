"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/staff", label: "Миний төслүүд" },
  { href: "/staff/bills/new", label: "Шинэ төсөл" },
];

export function StaffNav() {
  const path = usePathname() ?? "";
  return (
    <div className="border-b border-ink-100 bg-white">
      <div className="scroll-slim mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-4 sm:px-6">
        {items.map((it) => {
          const active =
            it.href === "/staff"
              ? path === "/staff"
              : path.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "press relative flex min-h-12 items-center whitespace-nowrap px-4 text-[14px] font-semibold transition-colors",
                active
                  ? "text-ink-950"
                  : "text-ink-600 hover:text-brand-800",
              )}
            >
              {it.label}
              {active ? (
                <span className="absolute inset-x-3 -bottom-px h-[3px] rounded-full bg-point-400" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
