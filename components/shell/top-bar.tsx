"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Show, SignInButton, UserButton } from "@clerk/nextjs";
import { cn } from "@/lib/cn";
import { Logo } from "./logo";
import { isActive, navItems } from "./nav-items";
import { NotificationBell } from "./notification-bell";

// Дээд самбар (наалттай). Компьютерт бүтэн цэс, гар утсанд лого + нэвтрэх.
export function TopBar() {
  const path = usePathname() ?? "/";

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface">
      <div className="mx-auto flex h-16 max-w-[1120px] items-center gap-4 px-4 sm:px-6">
        <Logo />

        <nav aria-label="Үндсэн цэс" className="ml-4 hidden items-center gap-1 lg:flex">
          {navItems.map((item) => {
            const active = isActive(item.href, path);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-2 text-[15px] font-medium transition-colors",
                  active ? "bg-surface-2 text-heading" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <NotificationBell />
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button type="button" className="min-h-9 rounded-md border border-line-strong px-3.5 text-[14px] font-semibold text-fg hover:border-primary">
                Нэвтрэх
              </button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
