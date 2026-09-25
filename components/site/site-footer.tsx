import Link from "next/link";
import Image from "next/image";

const cols = [
  {
    title: "Иргэн",
    links: [
      { label: "Хуулиуд", href: "/" },
      { label: "Миний оролцоо", href: "/me" },
      { label: "Хэрэгжилтийн үүрэг", href: "/directives/dir-042" },
    ],
  },
  {
    title: "Ажилтан",
    links: [
      { label: "Ажлын самбар", href: "/staff" },
      { label: "Тайлан шалгагч", href: "/staff/reports" },
      { label: "Хяналтын бүртгэл", href: "/staff/registry" },
      { label: "AI туслах", href: "/staff/ask" },
    ],
  },
  {
    title: "Нээлттэй",
    links: [
      { label: "Нөлөөллийн тоо", href: "/stats" },
      { label: "Пич", href: "/pitch" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-parliament-900/10 bg-parliament-950 text-white/85">
      <div className="mx-auto max-w-[1400px] px-6 py-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/Их_хурал_logo.png"
              alt="Монгол Улсын Их Хурал"
              width={220}
              height={80}
              className="h-16 w-auto object-contain"
            />
            <p className="mt-4 max-w-sm text-[12.5px] leading-relaxed text-white/70">
              Иргэдийн санал ба хууль тогтоомжийн хэрэгжилтийн ил тод байдлыг
              хангах платформ. Хакатон демо — жинхэнэ өгөгдөл руу шилжих
              загварчилсан хувилбар.
            </p>
          </div>
          {cols.map((c) => (
            <div key={c.title}>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gold-400">
                {c.title}
              </div>
              <ul className="mt-3 space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-[12.5px] text-white/80 transition hover:text-white"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-[11px] text-white/60">
          <div>© Монгол Улсын Их Хурал · Демо</div>
          <div className="flex items-center gap-3">
            <span>Стандарт: WCAG 2.1 AA</span>
            <span>·</span>
            <span>Хэл: MN</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
