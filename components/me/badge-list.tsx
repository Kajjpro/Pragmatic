import Link from "next/link";
import { Award } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { badgeLabels, type Badge } from "@/lib/types";
import { BadgeIcon } from "./badge-icon";

const dateFormat = new Intl.DateTimeFormat("mn-MN", { year: "numeric", month: "long", day: "numeric" });

// "Тэмдэг": авсан тэмдгүүд. "Хууль өөрчилсөн иргэн" бүр гэрчилгээний хуудастай.
export function BadgeList({ badges }: { badges: Badge[] }) {
  if (badges.length === 0) {
    return (
      <EmptyState
        icon={Award}
        title="Одоогоор тэмдэг алга"
        description="Таны санал хуульд тусгагдвал «Хууль өөрчилсөн иргэн» гэрчилгээ авна. 7 өдөр дараалан оролцох, анхны таамаг өгөхөд ч тэмдэг олгоно."
      />
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {badges.map((b) => (
        <li key={b.id} className="flex items-start gap-4 rounded-lg border border-line bg-surface p-4">
          <BadgeIcon type={b.type} className="mt-0.5 h-6 w-6" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-fg">{badgeLabels[b.type].title}</p>
            <p className="text-[14px] text-muted">
              {b.lawTitle ? `${b.lawTitle}${b.clauseNumber ? `, ${b.clauseNumber}-р заалт` : ""} · ` : ""}
              {dateFormat.format(new Date(b.createdAt))}
            </p>
          </div>
          {b.type === "LAW_CHANGER" ? (
            <Link href={`/b/${b.id}`} className="shrink-0 text-[14.5px] font-medium text-action underline underline-offset-2">
              Гэрчилгээ
            </Link>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
