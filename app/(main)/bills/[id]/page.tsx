import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, FileDown, Vote } from "lucide-react";
import { getUser } from "@/lib/auth";
import { getBillView } from "@/lib/law/queries";
import { getPublicBill, getUnchangedClauses } from "@/lib/law/public";
import { personaLabels } from "@/lib/types";
import { Container } from "@/components/ui/page-header";
import { Pill } from "@/components/ui/pill";
import { buttonClass } from "@/components/ui/button";
import { StageBar } from "@/components/law/stage-bar";
import { NO_REASON } from "@/components/law/change-explain";
import { BillComparison } from "@/components/law/bill-comparison";
import { formatDate } from "@/lib/format";

const MAX_KEY_CHANGES = 5;

export async function generateMetadata({ params }: PageProps<"/bills/[id]">): Promise<Metadata> {
  const { id } = await params;
  const bill = await getPublicBill(id).catch(() => null);
  if (!bill) return { title: "Хууль олдсонгүй" };
  const description = bill.description?.slice(0, 160) ?? "Хуулийн төслийн өөрчлөлт, энгийн тайлбар, иргэдийн санал.";
  return { title: bill.title, description, openGraph: { title: bill.title, description } };
}

export default async function BillPage({ params }: PageProps<"/bills/[id]">) {
  const { id } = await params;
  const bill = await getPublicBill(id);
  if (!bill) notFound();

  const [view, unchanged, user] = await Promise.all([
    getBillView(id, false),
    getUnchangedClauses(id),
    getUser().catch(() => null),
  ]);
  const clauses = view?.clauses ?? [];
  const isStaff = user?.role === "STAFF";

  // Товч дүгнэлт — зөвхөн урьдчилан бэлдсэн (эх текстээс шалгасан) тайлбараас
  const keyChanges = clauses.map((c) => c.what).filter((w): w is string => Boolean(w)).slice(0, MAX_KEY_CHANGES);
  const whos = Array.from(new Set(clauses.map((c) => c.who).filter((w): w is string => Boolean(w))));
  const whys = Array.from(new Set(clauses.map((c) => c.why).filter((w): w is string => Boolean(w) && w !== NO_REASON)));
  const personaText = bill.personas.map((p) => personaLabels[p]).join(", ");
  const count = (t: string) => clauses.filter((c) => c.changeType === t).length;
  // Задлан шинжилсэн эсэх: заалтын харьцуулалт эсвэл энгийн тайлбартай карт байгаа эсэх
  const analysed = clauses.length > 0 || bill.hasCard;

  return (
    <>
      {/* Толгой */}
      <header className="border-b border-line bg-surface">
        <Container className="py-8">
          <nav aria-label="Замын мөр" className="text-[14px] text-muted">
            <Link href="/bills" className="hover:text-fg hover:underline">
              Хуулийн өөрчлөлт
            </Link>
            <span aria-hidden> / </span>
            <span>Хуулийн төсөл</span>
          </nav>
          <h1 className="mt-3 max-w-4xl text-[26px] font-bold leading-snug sm:text-[32px]">{bill.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[14px] text-muted">
            {bill.typeTitle ? <span>{bill.typeTitle}</span> : null}
            {bill.categoryTitle ? <Pill>{bill.categoryTitle}</Pill> : null}
            {bill.projectNumber ? <span>Дугаар: {bill.projectNumber}</span> : null}
            {bill.publishedAt ? <span>LawForum-д нийтэлсэн: {formatDate(new Date(bill.publishedAt))}</span> : null}
            <span>Сүүлд шинэчилсэн: {formatDate(new Date(bill.updatedAt))}</span>
            {bill.lawforumComments !== null ? (
              <span>
                LawForum дээр <b className="tabular-nums text-fg">{bill.lawforumComments}</b> сэтгэгдэл
                {bill.lawforumViews !== null ? (
                  <>
                    , <b className="tabular-nums text-fg">{bill.lawforumViews}</b> үзэлт
                  </>
                ) : null}
              </span>
            ) : null}
            {bill.sourceUrl ? (
              <a href={bill.sourceUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-action underline underline-offset-2">
                Эх сурвалж: LawForum <ExternalLink aria-hidden className="h-3.5 w-3.5" />
              </a>
            ) : null}
          </div>
          <div className="mt-6 max-w-3xl">
            {bill.stage ? (
              <StageBar current={bill.stage} />
            ) : (
              <p className="text-[14px] text-muted">
                Хэлэлцүүлгийн шатыг LawForum дээрх төслийн хуудаснаас харна уу.
              </p>
            )}
          </div>
        </Container>
      </header>

      <Container className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-8">
          {/* Товч дүгнэлт */}
          <section aria-labelledby="summary" className="rounded-lg border border-line bg-surface p-5 sm:p-6">
            <h2 id="summary" className="text-[21px] font-bold">
              Товч дүгнэлт
            </h2>
            {keyChanges.length > 0 ? (
              <ul className="mt-3 list-disc space-y-1.5 pl-5">
                {keyChanges.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            ) : bill.cardMeaning ? (
              <p className="mt-3">{bill.cardMeaning}</p>
            ) : bill.summary ? (
              <p className="mt-3">{bill.summary}</p>
            ) : null}

            {analysed ? (
              <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-[14px] font-semibold text-heading">Хэнд хамаарах вэ</dt>
                  <dd className="mt-1 text-[15.5px]">{whos[0] ?? (personaText || "Төсөлд тодорхой дурдаагүй.")}</dd>
                </div>
                <div>
                  <dt className="text-[14px] font-semibold text-heading">Яагаад</dt>
                  <dd className="mt-1 text-[15.5px]">{whys[0] ?? NO_REASON}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-4 text-[14.5px] text-muted">
                Энэ төслийг бид хараахан задлан шинжлээгүй тул «хэнд, яагаад» гэсэн тайлбар алга. Доорх LawForum-ын танилцуулгыг уншина уу.
              </p>
            )}

            {clauses.length > 0 ? (
              <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-[14.5px]">
                {(
                  [
                    ["ADDED", "Нэмсэн заалт"],
                    ["REMOVED", "Хассан заалт"],
                    ["CHANGED", "Өөрчилсөн заалт"],
                  ] as const
                ).map(([t, label]) => (
                  <div key={t}>
                    <dt className="inline text-muted">{label}: </dt>
                    <dd className="inline font-semibold tabular-nums">{count(t)}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {bill.description ? (
              <details className="mt-5 border-t border-line pt-4">
                <summary className="cursor-pointer text-[15px] font-semibold text-action">Төслийн танилцуулга (LawForum)</summary>
                <p className="mt-3 whitespace-pre-line text-[15.5px] text-fg">{bill.description}</p>
              </details>
            ) : null}
          </section>

          {/* Заалт бүрийн харьцуулалт */}
          <section aria-labelledby="comparison">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <h2 id="comparison" className="text-[21px] font-bold">
                Заалт бүрийн харьцуулалт
              </h2>
              {isStaff && clauses.length > 0 ? (
                <a href={`/api/bills/${bill.id}/word`} className={buttonClass("secondary", "sm")}>
                  <FileDown aria-hidden className="h-4 w-4" /> Харьцуулсан хүснэгт татах (Word)
                </a>
              ) : null}
            </div>
            {clauses.length > 0 ? (
              <BillComparison
                clauses={clauses}
                unchanged={unchanged}
                commentCounts={bill.commentCounts}
                isSignedIn={Boolean(user)}
              />
            ) : (
              <div className="rounded-lg border border-dashed border-line-strong bg-surface p-6">
                <p className="font-semibold">Заалт бүрийн харьцуулалт хараахан бэлэн болоогүй байна.</p>
                <p className="mt-1 text-[15px] text-muted">
                  Энэ төслийн бүтэн текстийг одоогийн хуультай харьцуулж, ажлын алба шалгасны дараа энд нийтэлнэ.
                  Төслийн эх бичвэрийг LawForum дээрээс уншиж болно.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* Хажуугийн самбар */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
          {clauses.length > 0 ? (
            <nav aria-label="Өөрчлөгдсөн заалтууд" className="rounded-lg border border-line bg-surface p-4">
              <h2 className="font-sans text-[14px] font-semibold text-heading">Өөрчлөгдсөн заалтууд</h2>
              <ol className="mt-2 flex flex-col gap-1 text-[14.5px]">
                {clauses.map((c) => (
                  <li key={c.id}>
                    <a href={`#clause-${c.number}`} className="text-action hover:underline">
                      {c.number}-р заалт
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          ) : null}

          {bill.voteEvent ? (
            <section className="rounded-lg border border-line bg-surface p-4">
              <h2 className="flex items-center gap-2 font-sans text-[14px] font-semibold text-heading">
                <Vote aria-hidden className="h-4 w-4" /> Санал хураалтын таамаг
              </h2>
              {bill.voteEvent.isReplay ? <p className="mt-1 text-[13px] text-muted">Өмнө болсон санал хураалт</p> : null}
              <p className="mt-2 text-[15px]">{bill.voteEvent.hook}</p>
              <Link href={`/predict#event-${bill.voteEvent.id}`} className={buttonClass("secondary", "sm", "mt-3 w-full")}>
                {bill.voteEvent.status === "REVEALED" ? "Дүнг харах" : "Таамаглах"}
              </Link>
            </section>
          ) : null}

          {bill.sourceUrl ? (
            <section className="rounded-lg border border-line bg-surface p-4">
              <h2 className="font-sans text-[14px] font-semibold text-heading">Энэ хуулийг дагах</h2>
              <p className="mt-1 text-[14px] text-muted">LawForum дээр төслийг дагаж, шинэчлэлтийн мэдэгдэл авна уу.</p>
              <a href={bill.sourceUrl} target="_blank" rel="noreferrer noopener" className={buttonClass("secondary", "sm", "mt-3 w-full")}>
                LawForum дээр дагах <ExternalLink aria-hidden className="h-4 w-4" />
              </a>
            </section>
          ) : null}
        </aside>
      </Container>
    </>
  );
}
