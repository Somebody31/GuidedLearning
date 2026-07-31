export default function AppLoading() {
  return (
    <div className="flex min-h-full flex-col bg-[var(--canvas)]">
      <div className="h-14 border-b border-[var(--hairline)]" />
      <div className="mx-auto w-full max-w-5xl px-4 py-10 md:px-6">
        <div className="h-8 w-40 animate-pulse rounded-[var(--radius-md)] bg-[var(--surface-2)]" />
        <div className="mt-2 h-4 w-64 animate-pulse rounded-[var(--radius-sm)] bg-[var(--surface-1)]" />
        <div className="mt-8 h-32 animate-pulse rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)]" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="h-20 animate-pulse rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)]" />
          <div className="h-20 animate-pulse rounded-[var(--radius-xl)] border border-[var(--hairline)] bg-[var(--surface-1)]" />
        </div>
      </div>
    </div>
  );
}
