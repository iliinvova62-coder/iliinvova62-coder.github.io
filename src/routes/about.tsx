import { createFileRoute, Link } from "@tanstack/react-router";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Про школу — KATET SCHOOL" },
      {
        name: "description",
        content:
          "KATET SCHOOL — онлайн-школа математики для 1–11 класів. Індивідуальні та групові заняття, підготовка до НМТ, зрозумілі пояснення.",
      },
      { property: "og:title", content: "Про школу — KATET SCHOOL" },
      {
        property: "og:description",
        content: "Онлайн-школа математики: як ми вчимо та чому це працює.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AboutPage,
});

const values = [
  {
    title: "Розуміння замість заучування",
    text: "Ми не «натаскуємо» на формули — пояснюємо, звідки вони беруться. Коли учень розуміє логіку, задачі перестають бути страшними.",
  },
  {
    title: "Свій темп для кожного",
    text: "План занять будується під рівень учня: хтось доганяє шкільну програму, хтось іде на випередження чи готується до НМТ.",
  },
  {
    title: "Прозорий зворотний звʼязок",
    text: "Після кожного заняття викладач залишає звіт: тему, домашнє завдання і відгук про те, як пройшло заняття. Все видно в кабінеті.",
  },
  {
    title: "Комфорт онлайн-формату",
    text: "Заняття з дому, за зручним розкладом. Всі матеріали та результати — в особистому кабінеті учня.",
  },
];

function AboutPage() {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Про школу
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            KATET SCHOOL — онлайн-школа математики для учнів 1–11 класів. Ми віримо, що
            математика — це навичка, яку можна розвинути кожному: головне — правильне
            пояснення, системність і підтримка.
          </p>

          <div className="mt-12 grid gap-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-2xl border border-border/60 p-6">
                <h2 className="font-display text-lg font-semibold text-primary">{v.title}</h2>
                <p className="mt-2 leading-relaxed text-muted-foreground">{v.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 rounded-2xl bg-muted/50 p-8">
            <h2 className="font-display text-xl font-semibold">Як проходить навчання</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground">
              <li>Ви залишаєте заявку на сайті.</li>
              <li>Адміністратор школи призначає вам викладача та погоджує розклад.</li>
              <li>Ви навчаєтеся індивідуально або в групі — онлайн.</li>
              <li>Після кожного заняття отримуєте домашнє завдання та відгук викладача.</li>
              <li>Заняття оплачуєте пакетами — баланс завжди видно в кабінеті.</li>
            </ol>
            <Button asChild className="mt-8 rounded-full px-8">
              <Link to="/booking">Записатися на заняття</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
