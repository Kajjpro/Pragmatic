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
    <div className="rounded-xl border border-ink-200 bg-white p-4">
      <div className="mb-2 text-[12px] font-bold uppercase tracking-[0.12em] text-brand-700">
        {label}
      </div>
      <div className={muted ? "opacity-60" : ""}>{children}</div>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-ink-300 bg-brand-50/60 p-4 text-center text-[14px] font-medium text-ink-600">
      {text}
    </div>
  );
}
