"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/staff", label: "Миний төслүүд" },
];

export function StaffNav() {
  const path = usePathname() ?? "";
  return (
    <div className="border-b border-ink-100 bg-white">
      <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-6">
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
                "relative whitespace-nowrap px-4 py-3 text-[12.5px] font-semibold transition-colors",
                active
                  ? "text-parliament-900"
                  : "text-ink-500 hover:text-parliament-800",
              )}
            >
              {it.label}
              {active ? (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-parliament-800" />
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
