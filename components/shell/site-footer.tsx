import Link from "next/link";

// Нүүр хуудасны хөл — өгөгдлийн эх сурвалж, багийн нэр.
export function SiteFooter() {
  return (
    <footer className="border-t border-ink-200 bg-ink-50">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-[17px] font-extrabold text-white">
                Х
              </span>
              <span className="text-[18px] font-extrabold tracking-tight text-ink-900">
                Хариу
              </span>
            </div>
            <p className="mt-3 text-[14.5px] leading-relaxed text-ink-600">
              Хууль 60 секундэд. Таамагла. Өөрчил. Монгол Улсын Их Хурлыг
              залуучуудын өдөр тутмын дадал болгох платформ.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:gap-14">
            <div>
              <h3 className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-ink-600">
                Өгөгдлийн эх сурвалж
              </h3>
              <ul className="mt-3 space-y-2 text-[14.5px]">
                <li>
                  <a
                    href="https://lawforum.parliament.mn"
                    target="_blank"
                    rel="noreferrer noopener"
                    className="font-semibold text-ink-700 underline decoration-ink-300 underline-offset-2 hover:text-brand-700"
                  >
                    lawforum.parliament.mn
                  </a>
                </li>
                <li className="font-semibold text-ink-700">
                  УИХ-ын нээлттэй өгөгдөл
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-ink-600">
                Баг
              </h3>
              {/* TODO(Dev 3): багийн гишүүдийн нэрийг энд бичнэ */}
              <ul className="mt-3 space-y-2 text-[14.5px] font-semibold text-ink-700">
                <li>Багийн гишүүн 1</li>
                <li>Багийн гишүүн 2</li>
                <li>Багийн гишүүн 3</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ink-200 pt-5 text-[13.5px] text-ink-600">
          <span>Open Parliament Hackathon · Демо хувилбар</span>
          <Link href="/staff" className="font-semibold hover:text-brand-700">
            Ажилтны булан
          </Link>
        </div>
      </div>
    </footer>
  );
}
