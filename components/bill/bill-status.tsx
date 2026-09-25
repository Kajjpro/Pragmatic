import { cn } from "@/lib/cn";
import { commentStages } from "@/lib/labels";
import type { Stage } from "@/lib/law/types";

// Үе шатнаас нь хамаарч төслийн төлөвийг 3 ангилалд хуваана:
//   Санал өгөх нээлттэй · Хэлэлцэж байна · Батлагдсан
// Иргэн нэг харснаараа "би одоо санал өгч чадах уу?" гэдгээ мэдэх ёстой.
export type BillStatus = "OPEN" | "REVIEW" | "PASSED";

export function billStatus(stage: Stage): BillStatus {
  if (stage === "FINAL_APPROVAL") return "PASSED";
  if (commentStages.includes(stage)) return "OPEN";
  return "REVIEW";
}

const styles: Record<BillStatus, { label: string; className: string }> = {
  // Хамгийн чухал төлөв — цор ганц өргөлт өнгөөр (алт)
  OPEN: {
    label: "Санал өгөх нээлттэй",
    className: "bg-point-400 text-ink-950 ring-point-600/40",
  },
  REVIEW: {
    label: "Хэлэлцэж байна",
    className: "bg-brand-100 text-brand-800 ring-brand-300",
  },
  PASSED: {
    label: "Батлагдсан",
    className: "bg-emerald-100 text-emerald-800 ring-emerald-300",
  },
};

export function BillStatusBadge({
  stage,
  className,
}: {
  stage: Stage;
  className?: string;
}) {
  const s = styles[billStatus(stage)];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] font-bold ring-1 ring-inset",
        s.className,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {s.label}
    </span>
  );
}
