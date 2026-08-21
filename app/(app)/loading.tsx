import { CardSkeleton, Skeleton } from "@/components/shared/loading-state";

export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
