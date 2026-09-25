import Link from "next/link";
import {
  meFollowedLawIds,
  meNotifications,
  meParticipation,
} from "@/lib/stub/me";
import { laws } from "@/lib/stub/laws";
import { demoUser } from "@/lib/stub/context";
import { LawCard } from "@/components/law/law-card";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";

const stanceMeta = {
  support: { label: "Дэмжсэн", tone: "good" as const },
  oppose: { label: "Эсэргүүцсэн", tone: "danger" as const },
  neutral: { label: "Саармаг", tone: "neutral" as const },
};

const kindIcon: Record<string, string> = {
  response: "M4 12l4 4L16 6",
  stage: "M4 10h12M4 14h9",
  evidence: "M6 4h8l2 3v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z",
  vote: "M4 6l6 8 6-8",
};

export default function MePage() {
  const followed = laws.filter((l) => meFollowedLawIds.includes(l.id));
  const unread = meNotifications.filter((n) => !n.read).length;

  return (
    <div className="bg-parliament-50/30 pb-16">
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-parliament-700 to-parliament-900 text-lg font-bold text-white ring-4 ring-parliament-100">
              {demoUser.initial}
            </div>
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-parliament-500">
                Миний оролцоо
              </div>
              <h1 className="text-lg font-bold text-parliament-900">
                {demoUser.name} · {demoUser.role}
              </h1>
              <div className="text-[12px] text-ink-500">
                {meParticipation.length} бүлэгт орсон · {followed.length} хууль
                дагаж буй ·{" "}
                <span className="font-semibold text-parliament-800">
                  {unread} шинэ мэдэгдэл
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-[1400px] grid-cols-1 gap-6 px-6 pt-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-8">
          <div>
            <SectionHead
              title="Санал өгсөн бүлгүүд"
              subtitle="Таны санал агуулгаараа ижил байсан иргэдтэй нэгдсэн бүлэг"
            />
            {meParticipation.length ? (
              <ol className="mt-4 flex flex-col gap-3">
                {meParticipation.map((p) => {
                  const meta = stanceMeta[p.stance];
                  return (
                    <li
                      key={p.id}
                      className="rounded-2xl border border-ink-100 bg-white p-4 shadow-[0_18px_40px_-30px_rgba(15,42,99,0.3)] animate-rise"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone="info">{p.clauseNumber}</StatusPill>
                        <StatusPill tone={meta.tone}>{meta.label}</StatusPill>
                        <span className="text-[11px] text-ink-500">
                          {p.count.toLocaleString("mn-MN")} иргэн энэ бүлэгт
                        </span>
                        <Link
                          href={`/laws/${p.lawId}`}
                          className="ml-auto text-[11.5px] font-semibold text-parliament-800 hover:text-parliament-900"
                        >
                          Хуулиа үзэх →
                        </Link>
                      </div>
                      <h3 className="mt-2 text-[13.5px] font-semibold text-ink-900">
                        {p.clusterLabel}
                      </h3>
                      <div className="mt-0.5 text-[11.5px] text-ink-500">
                        {p.lawTitle}
                      </div>
                      {p.response ? (
                        <div className="mt-3 rounded-lg bg-parliament-50/60 p-3 text-[12.5px] text-parliament-900 ring-1 ring-parliament-100">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-parliament-500">
                            Комиссын хариу · {p.respondedAt}
                          </div>
                          <div className="mt-0.5">{p.response}</div>
                        </div>
                      ) : (
                        <div className="mt-3 text-[11.5px] text-amber-800">
                          Комиссын хариу хүлээгдэж байна.
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            ) : (
              <EmptyState
                title="Санал өгөөгүй байна"
                description="Аль нэг заалт дээр санал үлдээмэгц энд харагдана."
              />
            )}
          </div>

          <div>
            <SectionHead
              title="Дагаж буй хуулиуд"
              subtitle="Шат ахих, хариу гарах бүрд мэдэгдэл ирнэ"
            />
            {followed.length ? (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {followed.map((l) => (
                  <LawCard key={l.id} law={l} />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Дагаж буй хууль алга"
                description="Хуулийн хуудсаа нээгээд «Дагах» товч дар."
              />
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-ink-100 bg-white p-5 shadow-[0_20px_45px_-30px_rgba(15,42,99,0.3)]">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-semibold text-parliament-900">
              Мэдэгдэл
            </h3>
            <span className="rounded-full bg-parliament-50 px-2 py-0.5 text-[10.5px] font-semibold text-parliament-800">
              {unread} шинэ
            </span>
          </div>
          <ul className="mt-3 flex flex-col divide-y divide-ink-100">
            {meNotifications.map((n) => (
              <li key={n.id} className="py-3">
                <Link
                  href={n.href}
                  className="group flex items-start gap-3 rounded-lg p-1 transition hover:bg-parliament-50/60"
                >
                  <span
                    className={`mt-0.5 grid h-7 w-7 flex-none place-items-center rounded-full ${
                      n.read
                        ? "bg-ink-100 text-ink-500"
                        : "bg-parliament-800 text-white"
                    }`}
                  >
                    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5">
                      <path
                        d={kindIcon[n.kind]}
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`truncate text-[12.5px] font-semibold ${
                          n.read ? "text-ink-700" : "text-parliament-900"
                        }`}
                      >
                        {n.title}
                      </span>
                      {!n.read ? (
                        <span className="h-1.5 w-1.5 flex-none rounded-full bg-parliament-800" />
                      ) : null}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] text-ink-500">
                      {n.body}
                    </p>
                    <div className="mt-0.5 text-[10.5px] text-ink-500">
                      {n.createdAt}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </div>
  );
}

function SectionHead({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div>
      <h2 className="text-base font-bold text-parliament-900">{title}</h2>
      {subtitle ? (
        <p className="mt-0.5 text-[12.5px] text-ink-500">{subtitle}</p>
      ) : null}
    </div>
  );
}
