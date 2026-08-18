import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import { cn } from "@/lib/cn";

export function CtaLink({
  href,
  children,
  variant = "primary",
  icon = true,
  className,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  icon?: boolean;
  className?: string;
}) {
  if (variant === "secondary") {
    return (
      <Link href={href} className={cn("cta-secondary", className)}>
        {children}
      </Link>
    );
  }

  return (
    <Link href={href} className={cn("cta-primary", className)}>
      <span>{children}</span>
      {icon ? (
        <span className="cta-icon" aria-hidden>
          <ArrowUpRight size={15} weight="bold" />
        </span>
      ) : null}
    </Link>
  );
}

export function Wordmark({
  href = "/",
  className,
}: {
  href?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "shrink-0 text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]",
        className,
      )}
    >
      Guided<span className="text-[var(--accent)]">Learning</span>
    </Link>
  );
}
