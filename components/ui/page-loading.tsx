import { Container } from "./page-header";
import { RowSkeleton, Skeleton } from "./skeleton";

// Өгөгдөл ихтэй хуудсуудын нийтлэг ачаалалт (хуудас үсрэхгүйн тулд байрыг урьдчилан эзэлнэ)
export function PageLoading({ rows = 3 }: { rows?: number }) {
  return (
    <Container className="py-10">
      <div role="status" aria-label="Ачаалж байна">
        <Skeleton className="h-9 w-2/3 max-w-xl" />
        <Skeleton className="mt-3 h-5 w-1/2 max-w-md" />
        <div className="mt-8 flex flex-col gap-3">
          {Array.from({ length: rows }, (_, i) => (
            <RowSkeleton key={i} />
          ))}
        </div>
      </div>
    </Container>
  );
}
