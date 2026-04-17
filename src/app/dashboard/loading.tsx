import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <section className="container mx-auto px-6 py-24 md:py-32">
      {/* Header — mirrors dashboard welcome */}
      <header className="mb-16 max-w-2xl space-y-4">
        <Skeleton className="h-3 w-48 rounded-sm" />
        <Skeleton className="h-14 w-2/3 rounded-sm" />
        <Skeleton className="h-14 w-1/2 rounded-sm" />
      </header>

      {/* Two card-stamp articles, roman numerals I / II */}
      <div className="grid gap-6 md:grid-cols-2">
        {[0, 1].map((i) => (
          <article key={i} className="card-stamp p-7">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-12 w-8 rounded-sm" />
              <Skeleton className="h-9 w-9 rounded-full" />
            </div>
            <div className="mt-4 h-px w-full bg-gradient-to-r from-[color:var(--ember)]/60 via-border to-transparent" />
            <Skeleton className="mt-6 h-7 w-40 rounded-sm" />
            <div className="mt-4 space-y-2">
              <Skeleton className="h-4 w-full rounded-sm" />
              <Skeleton className="h-4 w-11/12 rounded-sm" />
              <Skeleton className="h-4 w-3/4 rounded-sm" />
            </div>
            <div className="mt-6">
              <Skeleton className="h-11 w-36 rounded-full" />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
