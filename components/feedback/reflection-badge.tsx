import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { Pill } from "@/components/ui/pill";
import { reflectionLabels } from "@/lib/labels";
import type { ReflectionValue } from "@/lib/law/queries";

// Санал тусгагдсан эсэх: Тусгасан / Тусгаагүй / Хүлээгдэж буй (дүрс + текст)
export function ReflectionBadge({ value }: { value: ReflectionValue }) {
  if (value === "REFLECTED")
    return (
      <Pill tone="good">
        <CheckCircle2 aria-hidden className="h-3.5 w-3.5" /> {reflectionLabels.REFLECTED}
      </Pill>
    );
  if (value === "NOT_REFLECTED")
    return (
      <Pill tone="bad">
        <XCircle aria-hidden className="h-3.5 w-3.5" /> {reflectionLabels.NOT_REFLECTED}
      </Pill>
    );
  return (
    <Pill>
      <Clock aria-hidden className="h-3.5 w-3.5" /> {reflectionLabels.PENDING}
    </Pill>
  );
}
