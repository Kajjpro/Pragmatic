"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/cn";
import { navItems } from "./nav-items";
import { Icon } from "./nav-icon";

// Гар утасны доод цэс. Компьютерт харагдахгүй (дээд цэс ажиллана).
export function BottomNav() {
  const path = usePathname() ?? "/";
  const reduce = useReducedMotion();

  return (
    <nav
      aria-label="Үндсэн цэс"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-200 bg-white/95 backdrop-blur-lg md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {navItems.map((item) => {
          // "/" зөвхөн яг таарвал идэвхтэй; бусад нь дэд хуудсыг хамруулна
          const active =
            item.href === "/" ? path === "/" : path.startsWith(item.href);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 pb-2 pt-2.5 text-[11.5px] font-bold transition-colors",
                  active ? "text-brand-700" : "text-ink-500 hover:text-ink-700",
                )}
                style={{ minHeight: "var(--bottom-nav-h)" }}
              >
                {/* Идэвхтэй зүйлийн дээд зураас — цэс хооронд гулсана */}
                {active ? (
                  <motion.span
                    layoutId="bottom-nav-active"
                    transition={
                      reduce
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 420, damping: 34 }
                    }
                    className="absolute inset-x-5 top-0 h-[3px] rounded-full bg-brand-600"
                  />
                ) : null}
                <Icon name={item.icon} active={active} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
