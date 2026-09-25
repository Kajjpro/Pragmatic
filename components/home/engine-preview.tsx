// "Ард нь ажилладаг хөдөлгүүр" — ажилтны харьцуулалтын дэлгэцийн жижиг урьдчилсан харагдац.
// Зураг биш, бодит markup (тод, layout shift үүсгэхгүй, файл татахгүй).
// Агуулга нь data/bill.txt дахь 35.1 дэх бодит өөрчлөлт.

function Del({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-bad-100 px-1 text-bad-800 line-through ring-1 ring-bad-100">
      {children}
    </mark>
  );
}

function Add({ children }: { children: React.ReactNode }) {
  return (
    <mark className="rounded bg-ok-100 px-1 font-bold text-ok-800 ring-1 ring-ok-100">
      {children}
    </mark>
  );
}

export function EnginePreview() {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-card">
      {/* Ажилтны самбарын хуурамч толгой */}
      <div className="flex items-center gap-2 border-b border-ink-200 bg-ink-50 px-4 py-3">
        <span className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-ink-300" />
        </span>
        <span className="ml-2 text-[13px] font-bold text-ink-600">
          УИХ Тамгын газар · Ажлын ширээ
        </span>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-brand-700 px-2 py-0.5 font-mono text-[12px] font-bold text-white">
            35.1
          </span>
          <span className="rounded-full bg-point-100 px-2.5 py-0.5 text-[11.5px] font-bold uppercase tracking-wide text-point-700 ring-1 ring-inset ring-point-300">
            Өөрчилсөн
          </span>
        </div>

        {/* Үг тутмын зөрүү — ажилтан яг ингэж хардаг */}
        <p className="mt-3 text-[14.5px] leading-[1.75] text-ink-900">
          Ажлын цагийн дээд хязгаар долоо хоногт 40 цаг байна. Ажил олгогч
          ажилтны <Del>зөвшөөрснөөр</Del>{" "}
          <Add>бичгээр гаргасан зөвшөөрлийн дагуу</Add> долоо хоногт{" "}
          <Del>8</Del> <Add>12</Add> цаг хүртэл илүү цагаар ажиллуулж болно
          <Add>
            {" "}
            бөгөөд сарын илүү цагийн нийт хэмжээ 40 цагаас хэтрэхгүй
          </Add>
          .
        </p>

        {/* Саналууд шүүгдэж, бүлэглэгдсэн байдал */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-ink-100 pt-4">
          <span className="rounded-full bg-brand-100 px-3 py-1 text-[12.5px] font-bold text-brand-800">
            3 бүлэг санал
          </span>
          <span className="rounded-full bg-ink-100 px-3 py-1 text-[12.5px] font-bold text-ink-700">
            AI шүүсэн: 12
          </span>
          <span className="rounded-full bg-ok-100 px-3 py-1 text-[12.5px] font-bold text-ok-800">
            ✓ Тусгасан
          </span>
        </div>
      </div>
    </div>
  );
}
