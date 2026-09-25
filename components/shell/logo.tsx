import Link from "next/link";

// "Хариу" лого: энгийн серифтэй нэр + жижиг хөх тэмдэг.
export function Logo() {
  return (
    <Link href="/" aria-label="Хариу — Нүүр" className="flex items-center gap-2 rounded-md">
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-md bg-primary font-serif text-[17px] font-bold text-on-primary">
        Х
      </span>
      <span className="font-serif text-[20px] font-bold text-heading">Хариу</span>
    </Link>
  );
}
