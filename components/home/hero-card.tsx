import Link from "next/link";

// Нүүр хуудасны гол блок — бүтээгдэхүүний гол санааг 3 алхмаар харуулна.
// Тоонууд нь DB-д байгаа бодит өгөгдлөөс ирдэг (зохиомол тоо байхгүй).
export type HeroStats = {
  changedClauses: number;
  comments: number;
  filtered: number;
  groups: number;
};

const steps = [
  {
    n: 1,
    title: "Ойлгох",
    staff: "Заалт бүрийг үг тутмаар автоматаар харьцуулна",
    citizen: "Мөн тэр өөрчлөлтийг энгийн монгол хэлээр",
  },
  {
    n: 2,
    title: "Сонсох",
    staff: "AI хамааралгүй саналыг шүүж, үлдсэнийг бүлэглэнэ",
    citizen: "Санал нь цэгцтэйгээр ажилтанд хүрнэ",
  },
  {
    n: 3,
    title: "Хариулах",
    staff: "Бүлэг тутамд нэг хариу, «Тусгасан / Тусгаагүй»",
    citizen: "«✅ Таны санал тусгагдлаа» гэдгийг хардаг",
  },
];

export function HeroCard({ stats }: { stats: HeroStats }) {
  return (
    <section className="overflow-hidden rounded-2xl bg-parliament-950 text-white shadow-[0_30px_80px_-40px_rgba(15,42,99,0.65)]">
      <div className="relative px-5 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-9">
        <div className="warm-glow" aria-hidden />

        <div className="relative">
          <div className="flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-400">
            <span className="h-px w-5 bg-gold-400" />
            Parlagmatic · Open Parliament
          </div>

          <h1 className="mt-3 max-w-2xl font-editorial text-[25px] font-medium leading-[1.2] sm:text-[32px]">
            Иргэн ба ажилтны хооронд нэг хана байдаг — ойлгоход хэцүү хуулийн
            төсөл.
          </h1>
          <p className="mt-3 max-w-xl text-[13.5px] leading-relaxed text-white/75">
            Машин нэг удаа өөрчлөлтийг ойлговол хоёр тал хоёулаа хожино.
            Ажилтны гар ажил хөнгөвчилж, иргэн саналынхаа хариуг хардаг.
            <span className="font-semibold text-gold-400">
              {" "}
              Нэг ажил, хоёр ашиг.
            </span>
          </p>

          {/* 3 алхам */}
          <ol className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {steps.map((s) => (
              <li
                key={s.n}
                className="rounded-xl bg-white/[0.06] p-3.5 ring-1 ring-white/10"
              >
                <div className="flex items-center gap-2">
                  <span className="grid h-5 w-5 place-items-center rounded-full bg-gold-400 text-[10px] font-bold text-parliament-950">
                    {s.n}
                  </span>
                  <span className="text-[13px] font-semibold text-white">
                    {s.title}
                  </span>
                </div>
                <p className="mt-2 text-[11.5px] leading-relaxed text-white/70">
                  <span className="font-semibold text-white/85">Ажилтан:</span>{" "}
                  {s.staff}
                </p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-white/70">
                  <span className="font-semibold text-white/85">Иргэн:</span>{" "}
                  {s.citizen}
                </p>
              </li>
            ))}
          </ol>

          {/* Бодит тоонууд */}
          <dl className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-white/10 pt-4">
            <Stat value={stats.changedClauses} label="харьцуулсан заалт" />
            <Stat value={stats.comments} label="иргэний санал" />
            <Stat value={stats.filtered} label="AI шүүсэн санал" />
            <Stat value={stats.groups} label="саналын бүлэг" />
          </dl>

          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <Link
              href="/me"
              className="inline-flex min-h-11 items-center rounded-full bg-gold-400 px-4 text-[12.5px] font-semibold text-parliament-950 transition hover:bg-gold-300"
            >
              Миний санал тусгагдсан уу?
            </Link>
            <Link
              href="/about"
              className="inline-flex min-h-11 items-center rounded-full border border-white/25 px-4 text-[12.5px] font-semibold text-white/90 transition hover:border-white hover:text-white"
            >
              Хэрхэн ажилладаг
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="font-editorial text-2xl font-medium tabular-nums text-gold-400">
        {value.toLocaleString("mn-MN")}
      </dt>
      <dd className="text-[11px] text-white/60">{label}</dd>
    </div>
  );
}
