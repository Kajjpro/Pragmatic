import Link from "next/link";
import Image from "next/image";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";

// Бүх дэлгэцийн дээд хэсэг. Утсан дээр: лого + нэр нэг мөрөнд, цэс доор нь.
const navItems = [
  { label: "Хууль төсөл", href: "/" },
  { label: "Миний санал", href: "/me" },
  { label: "Тамгын газар", href: "/staff" },
  { label: "Тухай", href: "/about" },
];

export function SiteHeader() {
  return (
    <header className="bg-parliament-950 text-white">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-90"
          aria-label="Parlagmatic — Нүүр"
        >
          <Image
            src="/Их_хурал_logo.png"
            alt="Монгол Улсын Их Хурал"
            width={220}
            height={80}
            priority
            className="h-9 w-auto object-contain sm:h-11"
          />
          <span className="flex flex-col leading-none">
            <span className="text-[15px] font-bold tracking-tight text-white sm:text-[17px]">
              Parlagmatic
            </span>
            <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-gold-400 sm:text-[10px]">
              Нэг ажил, хоёр ашиг
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="min-h-11 rounded-full border border-white/25 px-3.5 text-[12px] font-medium text-white/90 transition hover:border-white hover:text-white">
                Нэвтрэх
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="hidden min-h-11 rounded-full bg-gold-400 px-3.5 text-[12px] font-semibold text-parliament-950 transition hover:bg-gold-300 sm:inline-flex sm:items-center">
                Бүртгүүлэх
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton
              appearance={{
                elements: { avatarBox: "h-9 w-9 ring-2 ring-white/25" },
              }}
            />
          </Show>
        </div>
      </div>

      {/* Цэс — утсан дээр хажуу тийш шудрагдана */}
      <nav className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-[1400px] items-center gap-1 overflow-x-auto px-2 sm:px-4">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-lg px-3 text-[12.5px] font-medium tracking-[0.02em] text-white/80 transition hover:bg-white/[0.07] hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/25 to-transparent" />
    </header>
  );
}
