import type { WordPart } from "@/lib/law/types";
import { DiffText } from "./diff-text";

// Хоёр багана: Хүчин төгөлдөр | Төсөл. Утас дээр босоо.
export function ClauseCompare({
  oldText,
  newText,
  diff,
}: {
  oldText: string | null;
  newText: string | null;
  diff: WordPart[];
}) {
  const oldOnly = diff.filter((p) => !p.added);
  const newOnly = diff.filter((p) => !p.removed);
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      <Column label="Хүчин төгөлдөр" muted={!oldText}>
        {oldText ? (
          <DiffText parts={oldOnly} />
        ) : (
          <Empty text="Шинээр нэмэгдсэн заалт" />
        )}
      </Column>
      <Column label="Төсөл" muted={!newText}>
        {newText ? (
          <DiffText parts={newOnly} />
        ) : (
          <Empty text="Хасагдсан заалт" />
        )}
      </Column>
    </div>
  );
}

function Column({
  label,
  children,
  muted,
}: {
  label: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-3.5">
      <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-parliament-500">
        {label}
      </div>
      <div className={muted ? "opacity-60" : ""}>{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-ink-200 bg-parliament-50/40 p-3 text-center text-[12px] text-ink-500">
      {text}
    </div>
  );
}
