"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const items = [
  { href: "/staff", label: "Төслүүд" },
  { href: "/staff/bills/new", label: "Шинэ төсөл" },
];

// Ажилтны хэсгийн дэд цэс
export function StaffNav() {
  const path = usePathname() ?? "";
  return (
    <nav aria-label="Ажилтны цэс" className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-4 sm:px-6">
        {items.map((it) => {
          const active = it.href === "/staff" ? path === "/staff" : path.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "-mb-px flex min-h-12 items-center whitespace-nowrap border-b-2 px-4 text-[15px] font-medium",
                active ? "border-primary text-heading" : "border-transparent text-muted hover:text-fg",
              )}
            >
              {it.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
