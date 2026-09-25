// "Энгийнээр": юу өөрчлөгдсөн, яагаад (зөвхөн төслийн үндэслэлээс), хэнд хамаарах.
export const NO_REASON = "Шалтгааныг төсөлд дурдаагүй.";

export function ChangeExplain({ what, why, who }: { what: string | null; why: string | null; who: string | null }) {
  if (!what && !who) return null;
  return (
    <section className="rounded-md border-l-2 border-primary bg-surface-2 px-4 py-3">
      <h4 className="font-sans text-[14px] font-semibold text-heading">Энгийнээр</h4>
      <dl className="mt-2 grid gap-x-4 gap-y-2 sm:grid-cols-[120px_1fr]">
        {what ? <Row label="Юу өөрчлөгдөх" value={what} /> : null}
        <Row label="Яагаад" value={why || NO_REASON} />
        {who ? <Row label="Хэнд хамаарах" value={who} /> : null}
      </dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-[14px] font-medium text-muted">{label}</dt>
      <dd className="text-[15.5px] text-fg">{value}</dd>
    </>
  );
}
