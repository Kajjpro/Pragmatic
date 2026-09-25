import { cn } from "@/lib/cn";

// Ачаалж буйг харуулах саарал блок (globals.css дахь .skeleton).
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("skeleton rounded-xl", className)}
    />
  );
}

// Картны ачаалалтын жишиг хэлбэр
export function CardSkeleton() {
  return (
    <div className="rounded-3xl border border-ink-200 bg-white p-5 shadow-card">
      <Skeleton className="h-9 w-9 rounded-full" />
      <Skeleton className="mt-4 h-6 w-4/5" />
      <Skeleton className="mt-2.5 h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-2/3" />
      <Skeleton className="mt-5 h-12 w-full rounded-2xl" />
    </div>
  );
}
