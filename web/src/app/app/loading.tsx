// Brief placeholder while a page loads.

export default function AppLoading() {
  return (
    <div
      className="flex min-h-full flex-col bg-[var(--canvas)]"
      role="status"
      aria-label="Loading"
      aria-busy="true"
    >
      <div className="px-3 pt-3 md:px-5">
        <div className="island mx-auto flex h-14 max-w-[1120px] items-center rounded-full px-4">
          <div className="h-4 w-28 animate-pulse rounded bg-[var(--surface-2)]" />
          <div className="ml-auto h-7 w-20 animate-pulse rounded-full bg-[var(--surface-2)]" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <div className="h-8 w-40 animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-2)]" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-1)]" />
        <div className="plate-shell mt-8">
          <div className="plate-inner h-32 animate-pulse" />
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="h-20 animate-pulse rounded-[20px] bg-[var(--surface-1)]" />
          <div className="h-20 animate-pulse rounded-[20px] bg-[var(--surface-1)]" />
        </div>
        <span className="sr-only">Loading GuidedLearning…</span>
      </div>
    </div>
  );
}
