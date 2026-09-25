import Link from "next/link";
import Image from "next/image";
import {
  Show,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { DEMO_MODE, todayLabel } from "@/lib/stub/context";

const primaryNav = [
  { label: "ХУУЛЬ ТӨСӨЛ", href: "/" },
  { label: "МИНИЙ САНАЛ", href: "/me" },
];

const rightNav = [
  { label: "ТАМГЫН ГАЗАР", href: "/staff" },
  { label: "ТУХАЙ", href: "/about" },
];

export function SiteHeader() {
  return (
    <header className="relative isolate bg-parliament-950 text-white">
      {DEMO_MODE ? (
        <div className="border-b border-white/[0.08] bg-parliament-900/60">
          <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-1.5 text-[10.5px] text-white/70">
            <span className="flex items-center gap-1.5">
              <span className="inline-flex h-1.5 w-1.5 rounded-full bg-gold-400 shadow-[0_0_8px_rgba(244,197,66,0.6)]" />
              Демо горим · бүх өгөгдөл загварчилсан
            </span>
            <span className="hidden md:inline">{todayLabel}</span>
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 -top-24 h-64 bg-[radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.06),transparent_60%)]" />

      <div className="mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-6 px-6 pt-4 pb-3">
        <nav className="flex items-center gap-7 text-[11.5px] font-medium tracking-[0.09em]">
          {primaryNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-white/85 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="group flex flex-col items-center justify-center transition-transform hover:-translate-y-0.5"
          aria-label="Монгол Улсын Их Хурал — Нүүр"
        >
          <Image
            src="/Их_хурал_logo.png"
            alt="Монгол Улсын Их Хурал"
            width={220}
            height={80}
            priority
            className="h-16 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]"
          />
        </Link>

        <nav className="flex items-center justify-end gap-6 text-[11.5px] font-medium tracking-[0.09em]">
          {rightNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-white/85 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}

          <div className="ml-1 flex items-center gap-2">
            <Show when="signed-out">
              <SignInButton mode="modal">
                <button className="rounded-full border border-white/25 px-3 py-1 text-[11px] font-medium text-white/90 transition hover:border-white hover:text-white">
                  Нэвтрэх
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="rounded-full bg-gold-400 px-3 py-1 text-[11px] font-semibold text-parliament-950 transition hover:bg-gold-500">
                  Бүртгүүлэх
                </button>
              </SignUpButton>
            </Show>
            <Show when="signed-in">
              <UserButton
                appearance={{
                  elements: { avatarBox: "h-8 w-8 ring-2 ring-white/25" },
                }}
              />
            </Show>
          </div>
        </nav>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </header>
  );
}
