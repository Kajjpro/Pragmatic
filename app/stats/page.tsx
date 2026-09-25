import { impactStats, engagementTimeline } from "@/lib/stub/stats";
import { StatCard } from "@/components/ui/stat-card";

export default function StatsPage() {
  const max = Math.max(...engagementTimeline.map((p) => p.opinions));

  return (
    <div className="bg-parliament-50/30 pb-16">
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto max-w-[1400px] px-6 py-10">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-parliament-500">
            Нээлттэй өгөгдөл
          </div>
          <h1 className="mt-1 text-3xl font-bold text-parliament-900">
            Платформын нөлөө · нээлттэй тоо
          </h1>
          <p className="mt-2 max-w-3xl text-[13.5px] text-ink-500">
            Иргэдийн санал хэдийн бүлэглэгдэж, хэдэн хариу өгсөн, ажилтны цаг
            хэдээр хэмнэсэн — бүгд ил тод. Тоо бүр эх сурвалжтай.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1400px] px-6 pt-10">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {impactStats.map((s) => (
            <StatCard
              key={s.label}
              label={s.label}
              value={s.value}
              hint={s.hint}
              tone={
                s.tone === "danger"
                  ? "danger"
                  : s.tone === "warn"
                    ? "warn"
                    : s.tone === "good"
                      ? "good"
                      : "neutral"
              }
            />
          ))}
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-[1400px] px-6">
        <div className="rounded-2xl border border-ink-100 bg-white p-6 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
                7 сарын явц
              </div>
              <h2 className="mt-1 text-lg font-bold text-parliament-900">
                Иргэдийн санал ба комиссын хариу
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[11.5px] text-ink-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-parliament-500" />
                Ирсэн санал
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Хариу өгсөн
              </span>
            </div>
          </div>

          <div className="mt-6 flex h-56 items-end justify-around gap-4 border-b border-dashed border-ink-100 pb-2">
            {engagementTimeline.map((p) => {
              const ho = (p.opinions / max) * 100;
              const hr = (p.responses / max) * 100;
              return (
                <div
                  key={p.month}
                  className="group flex w-full max-w-[52px] flex-col items-center gap-1"
                >
                  <div className="flex h-full w-full items-end gap-1">
                    <div
                      className="flex-1 rounded-t-md bg-parliament-500 transition-[height] duration-500"
                      style={{ height: `${ho}%` }}
                      title={`${p.opinions.toLocaleString("mn-MN")} санал`}
                    />
                    <div
                      className="flex-1 rounded-t-md bg-emerald-500 transition-[height] duration-500"
                      style={{ height: `${hr}%` }}
                      title={`${p.responses.toLocaleString("mn-MN")} хариу`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-around text-[10.5px] font-medium text-ink-500">
            {engagementTimeline.map((p) => (
              <span key={p.month}>{p.month}-р сар</span>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 grid max-w-[1400px] grid-cols-1 gap-6 px-6 md:grid-cols-3">
        <Callout
          title="93.9% тайлан цаасан"
          body="Одоо байгууллагууд ихэвчлэн PDF/скан илгээдэг. Иргэн уншиж чадах хувилбар байдаггүй."
        />
        <Callout
          title="AI-аар 10 дахин хурдан"
          body="Мөр бүрд ажилтан дунджаар 42 минут зарцуулдаг байсныг 4 минут болголоо."
        />
        <Callout
          title="Хариугаа бариу"
          body="Иргэдийн бүлэг бүрд комиссын хариу баригдана. «Дуу тань хаана очив» гэсэн асуулт багасна."
        />
      </section>
    </div>
  );
}

function Callout({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-parliament-100 bg-gradient-to-br from-parliament-50/70 to-white p-5">
      <div className="text-[13.5px] font-bold text-parliament-900">{title}</div>
      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-700">{body}</p>
    </div>
  );
}
