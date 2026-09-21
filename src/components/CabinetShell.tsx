import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export function CabinetShell({
  title,
  subtitle,
  role,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  role: "student" | "teacher" | "admin";
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            {role === "admin" && (
              <Button asChild variant="ghost" size="sm" className="rounded-full">
                <Link to="/admin">Адмін-панель</Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm" className="rounded-full">
              <Link to="/cabinet">Кабінет</Link>
            </Button>
            <Button variant="outline" size="sm" className="rounded-full" onClick={signOut}>
              Вийти
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-primary">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const dateFmt = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatLessonDate(iso: string) {
  return dateFmt.format(new Date(iso));
}

export const statusLabel: Record<string, string> = {
  scheduled: "Заплановано",
  completed: "Проведено",
  cancelled: "Скасовано",
};

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "completed"
      ? "bg-mint/30 text-mint-strong"
      : status === "cancelled"
        ? "bg-destructive/10 text-destructive"
        : "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
      {statusLabel[status] ?? status}
    </span>
  );
}
