import { Link } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/60 bg-muted/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:flex-row sm:px-6">
        <Logo />
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/" className="transition-colors hover:text-foreground">
            Головна
          </Link>
          <Link to="/about" className="transition-colors hover:text-foreground">
            Про школу
          </Link>
          <Link to="/booking" className="transition-colors hover:text-foreground">
            Записатися
          </Link>
          <Link to="/contact" className="transition-colors hover:text-foreground">
            Контакти
          </Link>
        </nav>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} KATET SCHOOL
        </p>
      </div>
    </footer>
  );
}
