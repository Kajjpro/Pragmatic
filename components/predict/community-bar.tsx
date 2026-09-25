import { cn } from "@/lib/cn";

// Олны таамгийн харьцаа: "Батлагдана" / "Батлагдахгүй". Зөвхөн бодит таамгийн тоо (DB).
export function CommunityBar({ yes, total, className }: { yes: number; total: number; className?: string }) {
  if (total <= 0) {
    return <p className={cn("text-[14px] text-muted", className)}>Одоогоор хэн ч таамаглаагүй байна. Анхны таамгийг та өгөөрэй.</p>;
  }
  const yesPct = Math.round((yes / total) * 100);
  const noPct = 100 - yesPct;

  return (
    <div className={className}>
      <div className="flex items-baseline justify-between text-[13.5px]">
        <span className="font-semibold text-good-fg">
          Батлагдана <span className="tabular-nums">{yesPct}%</span>
        </span>
        <span className="text-muted">
          Олны таамаг · <span className="tabular-nums">{total.toLocaleString("mn-MN")}</span> хүн
        </span>
        <span className="font-semibold text-bad-fg">
          <span className="tabular-nums">{noPct}%</span> Батлагдахгүй
        </span>
      </div>
      <div
        className="mt-1.5 flex h-2.5 overflow-hidden rounded-full bg-surface-2"
        role="img"
        aria-label={`${total} хүний таамаг: ${yesPct}% батлагдана, ${noPct}% батлагдахгүй`}
      >
        <div className="h-full bg-good transition-[width] duration-700" style={{ width: `${yesPct}%` }} />
        <div className="h-full bg-bad/70 transition-[width] duration-700" style={{ width: `${noPct}%` }} />
      </div>
    </div>
  );
}
