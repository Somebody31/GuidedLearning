// Shared button styles.

import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  icon,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
}) {
  if (variant === "primary") {
    return (
      <button
        className={cn(
          "cta-primary disabled:pointer-events-none disabled:bg-[var(--surface-3)] disabled:text-[var(--text-disabled)] disabled:active:scale-100",
          size === "lg" && "h-11",
          size === "sm" && "h-9 text-[13px]",
          className,
        )}
        disabled={disabled}
        {...props}
      >
        <span>{children}</span>
        {icon ? (
          <span className="cta-icon" aria-hidden>
            {icon}
          </span>
        ) : null}
      </button>
    );
  }

  const variants: Record<Exclude<Variant, "primary">, string> = {
    secondary:
      "cta-secondary disabled:text-[var(--text-disabled)]",
    ghost:
      "inline-flex h-10 items-center justify-center rounded-full px-3 text-[13px] text-[var(--text-secondary)] transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] active:scale-[0.98] disabled:text-[var(--text-disabled)]",
    danger:
      "inline-flex h-10 items-center justify-center rounded-full border border-[var(--hairline)] px-4 text-[13px] text-[var(--danger)] transition-[color,background-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] hover:bg-[var(--accent-muted)] active:scale-[0.98] disabled:text-[var(--text-disabled)]",
  };

  return (
    <button
      className={cn(
        "font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent-ring)] disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100",
        variants[variant],
        size === "sm" && variant !== "secondary" && "h-8 text-[13px]",
        className,
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
