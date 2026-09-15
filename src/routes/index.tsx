import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import logoMark from "@/assets/logo-mark.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "KATET SCHOOL — Онлайн-школа математики для 1–11 класів" },
      {
        name: "description",
        content:
          "Онлайн-школа математики KATET SCHOOL: індивідуальні та групові заняття для 1–11 класів, підготовка до НМТ. Запишіться на перше заняття.",
      },
      { property: "og:title", content: "KATET SCHOOL — Онлайн-школа математики" },
      {
        property: "og:description",
        content: "Математика, яку нарешті зрозумієш. Онлайн-заняття для 1–11 класів та підготовка до НМТ.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

const audiences = [
  {
    title: "1–11 класи",
    text: "Від перших задач до складних тем шкільної програми — займемося у зручному темпі й закриємо пробіли.",
  },
  {
    title: "Підготовка до НМТ",
    text: "Структурна підготовка: розбір типів завдань, тренування на тестах, стратегія на день іспиту.",
  },
];

const steps = [
  {
    n: "01",
    title: "Залишаєте заявку",
    text: "Розкажіть про себе: клас, мета та зручний час для занять.",
  },
  {
    n: "02",
    title: "Підбираємо викладача",
    text: "Адміністратор школи звʼязується з вами та призначає викладача під вашу задачу.",
  },
  {
    n: "03",
    title: "Вчитеся онлайн",
    text: "Заняття у календарі, домашні завдання та відгуки викладача — в особистому кабінеті.",
  },
];

const advantages = [
  { title: "Зрозуміло з першого разу", text: "Пояснюємо простими словами, без «це очевидно»." },
  { title: "Індивідуально або в групі", text: "Обираєте формат, який підходить саме вам." },
  { title: "Все в одному кабінеті", text: "Розклад, домашні завдання та відгуки — онлайн." },
  { title: "Оплачуєте пакетами", text: "Без прихованых платежів: поповнюєте баланс заняттями." },
];

const testimonials = [
  {
    quote: "Донька нарешті перестала боятися математики. Після кожного заняття бачу чіткий відгук і домашнє завдання.",
    author: "Оксана, мама учениці 6 класу",
  },
  {
    quote: "Готувався до НМТ три місяці. Розібрали кожен тип завдань — на тесті була впевненість, а не паніка.",
    author: "Максим, 11 клас",
  },
  {
    quote: "Зручно, що все у кабінеті: розклад, домашка, оплата. Нагадування не дають пропустити заняття.",
    author: "Андрій, учень 9 класу",
  },
];

function Home() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div>
              <p className="mb-4 inline-flex items-center rounded-full border border-mint-strong/30 bg-mint/20 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-mint-strong">
                Онлайн-школа математики
              </p>
              <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-foreground sm:text-5xl">
                Математика, яку нарешті зрозумієш
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-muted-foreground">
                Онлайн-заняття для 1–11 класів та якісна підготовка до НМТ. Індивідуально
                або в групі — з викладачем, який пояснює просто.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="rounded-full px-8">
                  <Link to="/booking">Записатися на заняття</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-full px-8">
                  <Link to="/about">Про школу</Link>
                </Button>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute inset-0 -z-10 rounded-full bg-mint/25 blur-3xl" aria-hidden />
              <img
                src={logoMark}
                alt="Логотип KATET SCHOOL — книги та рукостискання"
                width={512}
                height={512}
                className="w-full rounded-3xl border border-border/60 bg-card shadow-sm"
              />
            </div>
          </div>
        </section>

        {/* Для кого */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Для кого наша школа
          </h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {audiences.map((a) => (
              <Card key={a.title} className="rounded-2xl border-border/60">
                <CardContent className="p-6">
                  <h3 className="font-display text-xl font-semibold text-primary">{a.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{a.text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Як почати */}
        <section className="bg-muted/40 py-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Як почати навчання
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {steps.map((s) => (
                <Card key={s.n} className="rounded-2xl border-border/60 bg-card">
                  <CardContent className="p-6">
                    <span className="font-display text-sm font-bold text-mint-strong">{s.n}</span>
                    <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Переваги */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Чому KATET SCHOOL
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {advantages.map((a) => (
              <div key={a.title} className="rounded-2xl border border-border/60 p-6">
                <h3 className="font-display font-semibold text-foreground">{a.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Відгуки */}
        <section className="bg-muted/40 py-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
            <h2 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Відгуки учнів та батьків
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.map((t) => (
                <Card key={t.author} className="rounded-2xl border-border/60">
                  <CardContent className="p-6">
                    <p className="leading-relaxed text-foreground">«{t.quote}»</p>
                    <p className="mt-4 text-sm text-muted-foreground">{t.author}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl bg-primary px-6 py-14 text-center sm:px-12">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-background sm:text-3xl">
              Перший крок — заявка на заняття
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-background/80">
              Заповніть коротку форму, і адміністратор школи підбере для вас викладача та
              запропонує зручний час.
            </p>
            <Button asChild size="lg" className="mt-8 rounded-full bg-mint px-8 text-primary hover:bg-mint/90">
              <Link to="/booking">Записатися</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
