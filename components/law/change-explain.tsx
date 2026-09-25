// Иргэнд зориулсан энгийн тайлбар: Юу / Яагаад / Хэн.
export function ChangeExplain({
  what,
  why,
  who,
}: {
  what: string | null;
  why: string | null;
  who: string | null;
}) {
  if (!what && !why && !who) return null;
  return (
    <div className="rounded-xl border-l-4 border-brand-700 bg-brand-50 p-4">
      <div className="mb-2.5 text-[12px] font-bold uppercase tracking-[0.12em] text-brand-700">
        Энгийн тайлбар
      </div>
      <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 sm:grid-cols-[130px_1fr]">
        {what ? (
          <Row label="Юу өөрчлөгдсөн" value={what} />
        ) : null}
        {why ? <Row label="Яагаад" value={why} /> : null}
        {who ? <Row label="Хэнд нөлөөлөх" value={who} /> : null}
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-[13px] font-bold text-brand-700">{label}</dt>
      <dd className="text-[15px] leading-relaxed text-ink-900">{value}</dd>
    </>
  );
}
