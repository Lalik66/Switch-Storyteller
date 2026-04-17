import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
  return (
    <section className="container mx-auto px-6 py-16 md:py-20">
      <div className="mx-auto max-w-3xl">
        {/* Header skeleton — mirrors chat page header */}
        <header className="mb-10 flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            <Skeleton className="h-3 w-40 rounded-sm" />
            <Skeleton className="h-12 w-3/4 rounded-sm" />
            <Skeleton className="h-12 w-1/2 rounded-sm" />
          </div>
          <Skeleton className="mt-2 h-3 w-24 rounded-sm" />
        </header>

        {/* Folio card skeleton */}
        <article className="card-stamp p-6 md:p-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24 rounded-sm" />
            <Skeleton className="h-3 w-20 rounded-sm" />
          </div>

          {/* rule ornament placeholder */}
          <div className="my-5 flex items-center gap-3">
            <Skeleton className="h-px flex-1 rounded-none" />
            <Skeleton className="h-2.5 w-2.5 rounded-full" />
            <Skeleton className="h-px flex-1 rounded-none" />
          </div>

          <div className="flex min-h-[45vh] flex-col gap-5">
            {/* Storyteller bubble */}
            <div className="flex w-full justify-start">
              <div className="max-w-[85%] flex-1 rounded-sm border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <Skeleton className="h-2.5 w-20 rounded-sm" />
                  <Skeleton className="h-2.5 w-12 rounded-sm" />
                </div>
                <Skeleton className="h-4 w-full rounded-sm" />
                <Skeleton className="mt-2 h-4 w-5/6 rounded-sm" />
                <Skeleton className="mt-2 h-4 w-2/3 rounded-sm" />
              </div>
            </div>

            {/* User bubble */}
            <div className="flex w-full justify-end">
              <div className="max-w-[85%] rounded-sm border border-[color:var(--ember)]/50 bg-[color:var(--gold)]/20 px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <Skeleton className="h-2.5 w-12 rounded-sm" />
                  <Skeleton className="h-2.5 w-10 rounded-sm" />
                </div>
                <Skeleton className="h-4 w-64 rounded-sm" />
              </div>
            </div>

            {/* Storyteller bubble */}
            <div className="flex w-full justify-start">
              <div className="max-w-[85%] flex-1 rounded-sm border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3">
                <div className="mb-2 flex items-center gap-2">
                  <Skeleton className="h-2.5 w-20 rounded-sm" />
                  <Skeleton className="h-2.5 w-12 rounded-sm" />
                </div>
                <Skeleton className="h-4 w-full rounded-sm" />
                <Skeleton className="mt-2 h-4 w-11/12 rounded-sm" />
                <Skeleton className="mt-2 h-4 w-3/4 rounded-sm" />
              </div>
            </div>
          </div>
        </article>

        {/* Input + submit skeleton */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Skeleton className="h-11 flex-1 rounded-sm" />
          <Skeleton className="h-11 w-28 rounded-full" />
        </div>
      </div>
    </section>
  );
}
