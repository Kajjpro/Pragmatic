import { Container } from "./page-header";
import { RowSkeleton, Skeleton } from "./skeleton";

// Жагсаалтын ачаалалт (хуудас дотор). Байрыг урьдчилан эзэлдэг тул хуудас үсрэхгүй.
export function ListSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Ачаалж байна" className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <RowSkeleton key={i} />
      ))}
    </div>
  );
}

// Бүтэн хуудасны ачаалалт (loading.tsx)
export function PageLoading({ rows = 3 }: { rows?: number }) {
  return (
    <Container className="py-10">
      <Skeleton className="h-9 w-2/3 max-w-xl" />
      <Skeleton className="mt-3 h-5 w-1/2 max-w-md" />
      <div className="mt-8">
        <ListSkeleton rows={rows} />
      </div>
    </Container>
  );
}
