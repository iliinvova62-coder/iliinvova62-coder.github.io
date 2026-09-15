import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Контакти — KATET SCHOOL" },
      {
        name: "description",
        content:
          "Контакти онлайн-школи математики KATET SCHOOL: Instagram, Telegram, email. Залиште заявку — відповімо найближчим часом.",
      },
      { property: "og:title", content: "Контакти — KATET SCHOOL" },
      { property: "og:description", content: "Звʼяжіться з онлайн-школою математики KATET SCHOOL." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContactPage,
});

const channels = [
  { label: "Instagram", value: "@katet_school", href: "https://instagram.com/katet_school" },
  { label: "Telegram", value: "Напишіть нам у Telegram", href: "https://t.me/katet_school" },
  { label: "Email", value: "hello@katet.school", href: "mailto:hello@katet.school" },
];

function ContactPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Контакти
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Маєте запитання про навчання? Напишіть нам — або залиште заявку, і ми
            звʼяжемося самі.
          </p>

          <div className="mt-10 grid gap-4">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-2xl border border-border/60 p-5 transition-colors hover:border-mint-strong/50 hover:bg-mint/10"
              >
                <div>
                  <p className="text-sm text-muted-foreground">{c.label}</p>
                  <p className="mt-0.5 font-medium text-foreground">{c.value}</p>
                </div>
                <span aria-hidden className="text-muted-foreground">→</span>
              </a>
            ))}
          </div>

          <Button asChild size="lg" className="mt-10 rounded-full px-8">
            <Link to="/booking">Залишити заявку</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}
