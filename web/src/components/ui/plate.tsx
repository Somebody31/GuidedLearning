// Nested tray + sheet used for major surfaces.

import { cn } from "@/lib/cn";

export function Plate({
  children,
  className,
  innerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
}) {
  return (
    <div className={cn("plate-shell", className)}>
      <div className={cn("plate-inner p-5 md:p-6", innerClassName)}>
        {children}
      </div>
    </div>
  );
}

export function DeskPage({
  children,
  width = "desk",
  className,
}: {
  children: React.ReactNode;
  width?: "desk" | "read" | "narrow";
  className?: string;
}) {
  const max =
    width === "read"
      ? "max-w-[42rem]"
      : width === "narrow"
        ? "max-w-lg"
        : "max-w-[1120px]";
  return (
    <div className={cn("mx-auto w-full px-4 pb-16 pt-4 md:px-6", max, className)}>
      {children}
    </div>
  );
}
