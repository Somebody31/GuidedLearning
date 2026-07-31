import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      <p className="text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--text-tertiary)]">
        404
      </p>
      <h1 className="text-[28px] font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="max-w-sm text-[14px] text-[var(--text-secondary)]">
        That route isn&apos;t part of the demo. Head back to your library or the
        Computer Networks atlas.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/app"
          className="inline-flex h-10 items-center rounded-full bg-[var(--accent)] px-5 text-[14px] font-medium text-[var(--text-invert)] transition-colors hover:bg-[var(--accent-hover)]"
        >
          Library
        </Link>
        <Link
          href="/app/courses/cn-kurose"
          className="inline-flex h-10 items-center rounded-full border border-[var(--hairline)] px-5 text-[14px] text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
        >
          Open demo atlas
        </Link>
      </div>
    </div>
  );
}
