import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Вхід у кабінет — KATET SCHOOL" },
      {
        name: "description",
        content:
          "Увійдіть в особистий кабінет онлайн-школи математики KATET SCHOOL: розклад занять, домашні завдання та відгуки викладача.",
      },
      { property: "og:title", content: "Вхід у кабінет — KATET SCHOOL" },
      { property: "og:description", content: "Особистий кабінет учня та викладача KATET SCHOOL." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s["redirect"] === "string" ? (s["redirect"] as string) : undefined,
  }),
  component: AuthPage,
});

function safePath(p: string | undefined) {
  return p && p.startsWith("/") && !p.startsWith("//") ? p : "/cabinet";
}

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const target = safePath(search.redirect);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: target, replace: true });
    });
  }, [navigate, target]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${target}`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setConfirmSent(true);
          return;
        }
        navigate({ to: target, replace: true });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: target, replace: true });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Не вдалося увійти";
      toast.error(
        msg.includes("Invalid login credentials") ? "Невірна пошта або пароль" : msg
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("Не вдалося увійти через Google");
      return;
    }
    if (result.redirected) return;
    navigate({ to: target, replace: true });
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <Card className="w-full max-w-md rounded-2xl border-border/60">
          <CardContent className="p-8">
            {confirmSent ? (
              <div className="text-center">
                <h1 className="font-display text-xl font-semibold">Перевірте пошту</h1>
                <p className="mt-3 text-muted-foreground">
                  Ми надіслали лист із підтвердженням на {email}. Відкрийте його, щоб
                  завершити реєстрацію.
                </p>
              </div>
            ) : (
              <>
                <h1 className="font-display text-2xl font-semibold tracking-tight">
                  {mode === "signin" ? "Вхід у кабінет" : "Реєстрація"}
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  {mode === "signin"
                    ? "Увійдіть, щоб побачити свої заняття та домашні завдання."
                    : "Створіть акаунт учня KATET SCHOOL."}
                </p>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  {mode === "signup" && (
                    <div className="grid gap-2">
                      <Label htmlFor="fullName">Імʼя та прізвище</Label>
                      <Input
                        id="fullName"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="email">Електронна пошта</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Пароль</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full rounded-full" disabled={busy}>
                    {busy ? "Зачекайте..." : mode === "signin" ? "Увійти" : "Зареєструватися"}
                  </Button>
                </form>

                <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="h-px flex-1 bg-border" />
                  або
                  <span className="h-px flex-1 bg-border" />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-full"
                  onClick={handleGoogle}
                >
                  Продовжити з Google
                </Button>

                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {mode === "signin" ? "Ще немає акаунта?" : "Вже маєте акаунт?"}{" "}
                  <button
                    type="button"
                    className="font-medium text-primary underline-offset-4 hover:underline"
                    onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                  >
                    {mode === "signin" ? "Зареєструватися" : "Увійти"}
                  </button>
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
