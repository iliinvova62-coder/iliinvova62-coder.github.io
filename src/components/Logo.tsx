import { Link } from "@tanstack/react-router";
import logoMark from "@/assets/logo-mark.png";
import { cn } from "@/lib/utils";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-2.5", className)}>
      <img
        src={logoMark}
        alt="Логотип KATET SCHOOL"
        width={512}
        height={512}
        className="h-10 w-10 rounded-full object-cover ring-1 ring-border"
        loading="lazy"
      />
      <span
        className={cn(
          "font-display text-lg font-semibold tracking-[0.18em]",
          light ? "text-background" : "text-primary"
        )}
      >
        KATET
      </span>
      <span
        className={cn(
          "font-display text-lg font-medium tracking-[0.18em]",
          light ? "text-mint" : "text-mint-strong"
        )}
      >
        SCHOOL
      </span>
    </Link>
  );
}
