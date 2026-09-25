import Link from "next/link";
import Image from "next/image";
import { DEMO_MODE, todayLabel } from "@/lib/stub/context";

const primaryNav = [
  { label: "УЛСЫН ИХ ХУРЛЫН ТУХАЙ", href: "#" },
  { label: "УЛСЫН ИХ ХУРЛЫН ҮЙЛ АЖИЛЛАГАА", href: "#" },
  { label: "ТАМГЫН ГАЗАР", href: "#" },
];

const rightNav = [
  { label: "ИХ ХУРЛЫН ГИШҮҮД", href: "#" },
  { label: "ЦЭХИЙН ПАРЛАМЕНТ", href: "#" },
  { label: "МЭДЭЭЛЛИЙН САН", href: "#" },
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

        <nav className="flex items-center justify-end gap-7 text-[11.5px] font-medium tracking-[0.09em]">
          {rightNav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-white/85 transition-colors hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/me"
            aria-label="Миний оролцоо"
            className="ml-2 grid h-7 w-7 place-items-center rounded-full border border-white/25 text-white/85 transition hover:border-white hover:text-white"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
              <circle cx="10" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4 17c1-3 4-4 6-4s5 1 6 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </Link>
        </nav>
      </div>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </header>
  );
}
