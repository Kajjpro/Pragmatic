import type { Metadata } from "next";
import Link from "next/link";
import { AgeHook } from "@/components/home/age-hook";
import { PhoneMockup } from "@/components/home/phone-mockup";
import { EnginePreview } from "@/components/home/engine-preview";
import { SiteFooter } from "@/components/shell/site-footer";
import { getFeed } from "@/lib/feed";

// Нүүр хуудсыг хуваалцахад гарах гарчиг, тайлбар
export const metadata: Metadata = {
  title: "Хууль 60 секундэд. Таамагла. Өөрчил.",
  description:
    "Та УИХ-ыг хэдэн настайдаа анх мэдсэн бэ? Хуулийн өөрчлөлтийг 60 секундэд ойлгож, санал хураалтыг таамаглаж, саналаа хуульд тусга.",
  openGraph: {
    siteName: "Хариу",
    locale: "mn_MN",
    type: "website",
    title: "Хууль 60 секундэд. Таамагла. Өөрчил.",
    description:
      "Монгол Улсын Их Хурлыг залуучуудын өдөр тутмын дадал болгох платформ.",
  },
};

// ① ② ⑥ — бүтээгдэхүүний гурван алхам
const steps = [
  {
    n: "①",
    emoji: "📖",
    title: "Ойлго",
    line: "60 секундийн карт — хуулийн өөрчлөлт энгийн үгээр.",
    href: "/feed",
    cta: "Карт үзэх",
  },
  {
    n: "②",
    emoji: "🎯",
    title: "Таамагла",
    line: "Санал хураалт батлагдах эсэхийг таа, оноо цуглуул.",
    href: "/predict",
    cta: "Таамаглах",
  },
  {
    n: "⑥",
    emoji: "🏛️",
    title: "Өөрчил",
    line: "Санал чинь хуульд тусгагдвал тэмдэг авна.",
    href: "/me",
    cta: "Миний нөлөө",
  },
];

export default async function HomePage() {
  // Утасны макетад бодит фийдийн эхний 3 картыг харуулна.
  // DB бэлэн биш байсан ч нүүр хуудас унахгүй — макетыг л нуух болно.
  const previewCards = (await getFeed("ALL").catch(() => [])).slice(0, 3);

  return (
    <div className="flex flex-col">
      {/* ── 1-Р ХЭСЭГ: ДЭГЭЭ ─────────────────────────────── */}
      <section className="chrome-brand relative overflow-hidden">
        <div className="grain" aria-hidden />
        <div
          className={
            previewCards.length > 0
              ? "relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_auto] lg:gap-14 lg:py-24"
              : "relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24"
          }
        >
          <AgeHook />
          {previewCards.length > 0 ? (
            <div className="flex justify-center lg:justify-end">
              <PhoneMockup cards={previewCards} />
            </div>
          ) : null}
        </div>
      </section>

      {/* ── 2-Р ХЭСЭГ: 3 АЛХАМ ───────────────────────────── */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink-950 sm:text-[36px]">
            Гурван алхам, нэг дадал
          </h2>
          <p className="mt-2 max-w-xl text-[16px] leading-relaxed text-ink-600 sm:text-[17px]">
            Өдөрт нэг карт. Долоо хоногт нэг таамаг. Саналаа хуульд тусга.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {steps.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="card-lift group flex flex-col rounded-3xl border border-ink-200 bg-white p-6 shadow-card hover:border-brand-300 hover:shadow-lift"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-[28px]"
                    aria-hidden
                  >
                    {s.emoji}
                  </span>
                  <span className="text-[22px] font-extrabold text-brand-300" aria-hidden>
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-4 text-[22px] font-extrabold tracking-tight text-ink-950">
                  {s.title}
                </h3>
                <p className="mt-2 flex-1 text-[15.5px] leading-relaxed text-ink-600">
                  {s.line}
                </p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[15px] font-extrabold text-brand-700 transition-transform group-hover:translate-x-0.5">
                  {s.cta} <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3-Р ХЭСЭГ: ХӨДӨЛГҮҮР ─────────────────────────── */}
      <section className="bg-ink-50 py-14 sm:py-20">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-14">
          <div>
            <span className="inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-[12.5px] font-extrabold uppercase tracking-[0.1em] text-brand-800">
              Ард нь ажилладаг хөдөлгүүр
            </span>
            <h2 className="mt-4 text-[26px] font-extrabold leading-tight tracking-tight text-ink-950 sm:text-[36px]">
              Энэ бол зүгээр нэг иргэний апп биш
            </h2>
            <p className="mt-3 max-w-lg text-[16.5px] leading-relaxed text-ink-700 sm:text-[17.5px]">
              Залуучуудын санал шүүгдэж, бүлэглэгдэж УИХ-ын ажилтанд очдог.
              Ажилтан заалт бүрийн өөрчлөлтийг үг тутмаар харьцуулж, бүлэг
              тутамд нэг хариу бичнэ.
            </p>
            <Link
              href="/staff"
              className="press mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl border-2 border-ink-300 bg-white px-5 text-[15px] font-extrabold text-ink-900 hover:border-brand-400 hover:text-brand-700"
            >
              Ажилтны ширээг үзэх →
            </Link>
          </div>

          <EnginePreview />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
