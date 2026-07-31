import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-[var(--text-invert)] hover:bg-[var(--accent-hover)] active:bg-[var(--accent-press)] disabled:bg-[var(--surface-3)] disabled:text-[var(--text-disabled)]",
  secondary:
    "bg-transparent text-[var(--text-primary)] border border-[var(--hairline)] hover:bg-[var(--surface-2)] disabled:text-[var(--text-disabled)]",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] disabled:text-[var(--text-disabled)]",
  danger:
    "bg-transparent text-[var(--danger)] border border-[var(--hairline)] hover:bg-[rgba(248,113,113,0.1)] disabled:text-[var(--text-disabled)]",
};

const sizes: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px] rounded-[var(--radius-sm)]",
  md: "h-9 px-4 text-[14px] rounded-[var(--radius-md)]",
  lg: "h-10 px-5 text-[15px] rounded-full",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium transition-[color,background-color,border-color,transform] duration-[var(--duration-fast)] ease-[var(--ease-out-soft)] active:scale-[0.98] disabled:cursor-not-allowed disabled:pointer-events-none disabled:active:scale-100",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled}
      {...props}
    />
  );
}
