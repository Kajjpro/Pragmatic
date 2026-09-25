import { cn } from "@/lib/cn";

// Ачаалж буйг харуулах саарал блок. Байрлалыг урьдчилан эзэлдэг тул хуудас үсрэхгүй.
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("skeleton rounded-md", className)} />;
}

// Жагсаалтын нэг мөрний ачаалалт
export function RowSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-surface p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-3 h-6 w-4/5" />
      <Skeleton className="mt-2 h-4 w-2/3" />
    </div>
  );
}
