"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { Briefcase } from "lucide-react";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import { isActive, navItems } from "./nav-items";
import { NotificationBell } from "./notification-bell";
import { PointsBadge, StreakButton } from "./header-stats";
import { useMe } from "./me-context";

// Наалттай толгой: лого, (ажилтанд) ажилтны хэсэг, дараалсан өдөр, оноо, нэвтрэх.
// Компьютерт доор нь табан цэс; гар утсанд доод цэс (BottomNav).
export function TopBar() {
  const path = usePathname() ?? "/";
  const { me } = useMe();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/85">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-3 px-4 sm:px-6">
        <Logo />

        <div className="ml-auto flex items-center gap-2">
          {me?.role === "STAFF" ? (
            <Link
              href="/staff"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-primary px-3.5 text-[14px] font-semibold text-on-primary shadow-brand hover:bg-primary-hover"
            >
              <Briefcase aria-hidden className="h-4 w-4" />
              <span className="hidden sm:inline">Ажилтны хэсэг</span>
            </Link>
          ) : null}
          <StreakButton />
          <PointsBadge />
          <NotificationBell />
          <Show when="signed-out">
            {/* Нэвтэрсний дараа /after-sign-in: ажилтан → /staff, иргэн → байсан хуудас руугаа */}
            <SignInButton mode="modal" forceRedirectUrl={`/after-sign-in?next=${encodeURIComponent(path)}`}>
              <button type="button" className="min-h-9 rounded-full border border-line-strong px-3.5 text-[14px] font-semibold text-fg hover:border-primary">
                Нэвтрэх
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>

      {/* Табан цэс (компьютер) */}
      <nav aria-label="Үндсэн цэс" className="hidden border-t border-line lg:block">
        <ul className="mx-auto flex max-w-[1180px] items-stretch gap-1 px-4 sm:px-6">
          {navItems.map((item) => {
            const active = isActive(item.href, path);
            const Icon = item.icon;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "-mb-px flex h-12 items-center gap-2 border-b-2 px-3 text-[14.5px] font-medium transition-colors",
                    active ? "border-primary text-heading" : "border-transparent text-muted hover:border-line-strong hover:text-fg",
                  )}
                >
                  <Icon aria-hidden className="h-4 w-4" strokeWidth={active ? 2.25 : 1.75} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
