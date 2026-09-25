import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="bg-parliament-50/30 pb-16">
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[900px] px-6 py-10">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-parliament-500">
            Тухай
          </div>
          <h1 className="mt-1 font-editorial text-3xl font-medium text-parliament-900">
            Иргэдийн санал ба хуулийн харьцуулалт
          </h1>
          <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ink-700">
            Энэ платформ Монгол Улсын Их Хурлын хууль тогтоомжид иргэдийн
            саналыг цэгцлэн хүлээн авч, хууль өөрчлөгдөх бүрт «юу
            солигдсоныг» ажилтан, иргэн хоёуланд нь ил тод харуулах зорилготой.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[900px] px-6 pt-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card
            title="Хуулийн заалт бүрийн харьцуулалт"
            body="Ажилтан хүчин төгөлдөр хууль болон төслийг оруулбал, систем заалт бүрийн үг, өгүүлбэрийн өөрчлөлтийг харьцуулж, тодруулж харуулна. Word тайлан татах боломжтой."
          />
          <Card
            title="«Миний санал тусгагдсан уу?»"
            body="Иргэн заалт дээр санал үлдээхэд систем ижил санаатай саналуудыг бүлэглэнэ. Комисс тухайн бүлэгт хариу өгч, «Тусгасан / Тусгаагүй» гэсэн тэмдэглэгээ тавьдаг. Иргэн эргээд хариугаа хардаг."
          />
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-[900px] px-6">
        <div className="rounded-2xl border border-parliament-100 bg-white p-6">
          <h2 className="font-editorial text-lg font-medium text-parliament-900">
            Технологи
          </h2>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-[12.5px] text-ink-700 sm:grid-cols-2">
            <li>
              <b className="text-parliament-700">AI</b> — санал бүлэглэх, хариу
              ноорог, өөрчлөлтийн тайлбар
            </li>
            <li>
              <b className="text-parliament-700">Код</b> — үг бүрийн харьцуулалт
              (100% үнэн зөв), Word гаргалт
            </li>
            <li>
              <b className="text-parliament-700">Хүн</b> — эцсийн шийдвэрийг
              ажилтан гаргана
            </li>
            <li>
              <b className="text-parliament-700">Нээлттэй</b> — код нь Open
              Parliament хакатоны хүрээнд бүтээгдсэн
            </li>
          </ul>
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-[900px] px-6 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full bg-parliament-700 px-5 py-2 text-[12.5px] font-semibold text-white transition hover:bg-parliament-800"
        >
          Хуулиудыг үзэх →
        </Link>
      </section>
    </div>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_18px_40px_-30px_rgba(15,42,99,0.3)]">
      <h3 className="font-editorial text-base font-medium text-parliament-900">
        {title}
      </h3>
      <p className="mt-2 text-[12.5px] leading-relaxed text-ink-700">{body}</p>
    </div>
  );
}
