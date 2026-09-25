import { Minus, Pencil, Plus } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { changeTypeLabels } from "@/lib/labels";
import type { ChangeType } from "@/lib/law/types";

// Заалт нэмсэн / хассан / өөрчилсөн эсэх (дүрс + текст, зөвхөн өнгө биш)
export function ChangeBadge({ type }: { type: ChangeType }) {
  if (type === "ADDED")
    return (
      <Pill tone="good">
        <Plus aria-hidden className="h-3.5 w-3.5" /> {changeTypeLabels.ADDED}
      </Pill>
    );
  if (type === "REMOVED")
    return (
      <Pill tone="bad">
        <Minus aria-hidden className="h-3.5 w-3.5" /> {changeTypeLabels.REMOVED}
      </Pill>
    );
  if (type === "CHANGED")
    return (
      <Pill tone="action">
        <Pencil aria-hidden className="h-3.5 w-3.5" /> {changeTypeLabels.CHANGED}
      </Pill>
    );
  return <Pill>{changeTypeLabels.UNCHANGED}</Pill>;
}
