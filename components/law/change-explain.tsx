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
    <div className="rounded-xl bg-parliament-50/60 p-4">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
        Энгийн тайлбар
      </div>
      <dl className="grid grid-cols-1 gap-3 sm:grid-cols-[80px_1fr]">
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
      <dt className="text-[11px] font-semibold text-parliament-700">{label}</dt>
      <dd className="text-[12.5px] leading-relaxed text-ink-900">{value}</dd>
    </>
  );
}
