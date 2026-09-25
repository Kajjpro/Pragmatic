import { Skeleton } from "@/components/ui/skeleton";

// Фийд ачаалж байх үеийн хэлбэр — бодит картын бүтэцтэй ижил.
export function FeedSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 flex-col" aria-busy="true">
      <div className="flex shrink-0 items-center gap-3 px-1 pb-2.5">
        <div className="flex flex-1 items-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-1.5 flex-1 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-4 w-10" />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden rounded-3xl border border-ink-200 bg-white shadow-card">
        <div className="bg-brand-50 px-5 pb-5 pt-5">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="mt-3.5 h-8 w-11/12" />
          <Skeleton className="mt-2 h-8 w-2/3" />
        </div>
        <div className="flex flex-col gap-4 px-5 py-5">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-4 w-56" />
        </div>
      </div>

      <div className="shrink-0 pt-2.5">
        <Skeleton className="mx-auto h-11 w-48 rounded-full" />
      </div>
      <span className="sr-only">Хуулиудыг ачаалж байна…</span>
    </div>
  );
}
