import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { submitLessonRequest } from "@/lib/booking.functions";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "Запис на заняття — KATET SCHOOL" },
      {
        name: "description",
        content:
          "Запишіться на заняття з математики в онлайн-школі KATET SCHOOL: індивідуальні та групові заняття для 1–11 класів і підготовка до НМТ.",
      },
      { property: "og:title", content: "Запис на заняття — KATET SCHOOL" },
      {
        property: "og:description",
        content: "Залиште заявку — адміністратор підбере викладача та зручний час.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BookingPage,
});

function BookingPage() {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [grade, setGrade] = useState("");
  const [goal, setGoal] = useState("");
  const [format, setFormat] = useState<"individual" | "group">("individual");
  const [preferredTime, setPreferredTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const submit = useServerFn(submitLessonRequest);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submit({
        data: {
          studentName: name,
          contact,
          grade: grade ? Number(grade) : null,
          goal,
          format,
          preferredTime,
        },
      });
      setDone(true);
      toast.success("Заявку надіслано!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Не вдалося надіслати заявку");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6">
          <h1 className="font-display text-3xl font-bold tracking-tight">Запис на заняття</h1>
          <p className="mt-3 text-muted-foreground">
            Заповніть форму — адміністратор школи звʼяжеться з вами та призначить викладача.
          </p>

          {done ? (
            <Card className="mt-10 rounded-2xl border-mint-strong/30 bg-mint/15">
              <CardContent className="p-8 text-center">
                <p className="font-display text-xl font-semibold text-primary">
                  Дякуємо! Заявку надіслано.
                </p>
                <p className="mt-2 text-muted-foreground">
                  Ми звʼяжемося з вами найближчим часом, щоб підібрати викладача та час занять.
                </p>
                <Button asChild className="mt-6 rounded-full" variant="outline">
                  <Link to="/">Повернутися на головну</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="mt-10 rounded-2xl border-border/60">
              <CardContent className="p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Імʼя учня *</Label>
                    <Input
                      id="name"
                      required
                      minLength={2}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Наприклад: Марія"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contact">Телефон або Telegram *</Label>
                    <Input
                      id="contact"
                      required
                      minLength={3}
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+380..." 
                    />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="grade">Клас</Label>
                      <select
                        id="grade"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                      >
                        <option value="">Оберіть клас</option>
                        {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
                          <option key={g} value={g}>
                            {g} клас
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="time">Зручний час занять</Label>
                      <Input
                        id="time"
                        value={preferredTime}
                        onChange={(e) => setPreferredTime(e.target.value)}
                        placeholder="Наприклад: вечори у вівторок і четвер"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <Label>Формат занять</Label>
                    <RadioGroup
                      value={format}
                      onValueChange={(v) => setFormat(v as "individual" | "group")}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="individual" id="fmt-ind" />
                        <Label htmlFor="fmt-ind" className="font-normal cursor-pointer">
                          Індивідуальні
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="group" id="fmt-grp" />
                        <Label htmlFor="fmt-grp" className="font-normal cursor-pointer">
                          Групові
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="goal">Мета навчання</Label>
                    <Textarea
                      id="goal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      placeholder="Наприклад: підтягнути алгебру або підготуватися до НМТ"
                      rows={4}
                    />
                  </div>
                  <Button type="submit" size="lg" className="w-full rounded-full" disabled={submitting}>
                    {submitting ? "Надсилаємо..." : "Надіслати заявку"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
