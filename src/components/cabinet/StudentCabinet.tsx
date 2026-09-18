import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import {
  CabinetShell,
  StatCard,
  StatusBadge,
  formatLessonDate,
} from "@/components/CabinetShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getStudentDashboard,
  updateMyProfile,
  type Role,
} from "@/lib/cabinet.functions";

type Account = {
  userId: string;
  role: Role;
  profile: { id: string; full_name: string; phone: string | null; grade: number | null };
};

type Lesson = {
  id: string;
  starts_at: string;
  duration_min: number;
  format: string;
  status: string;
  lesson_link: string | null;
  group_id: string | null;
  groups: { name: string } | null;
  profiles: { full_name: string } | null;
  lesson_reports: { topic: string | null; homework: string | null; feedback: string | null }[];
};

export function StudentCabinet({ account }: { account: Account }) {
  const fetchDashboard = useServerFn(getStudentDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["student-dashboard"],
    queryFn: () => fetchDashboard(),
  });

  const lessons = (data?.lessons ?? []) as unknown as Lesson[];
  const now = Date.now();
  const upcoming = lessons.filter(
    (l) => l.status === "scheduled" && new Date(l.starts_at).getTime() >= now
  );
  const past = lessons
    .filter((l) => l.status !== "scheduled" || new Date(l.starts_at).getTime() < now)
    .reverse();
  const withHomework = past.filter((l) => l.lesson_reports?.[0]);

  return (
    <CabinetShell
      title={`Вітаємо, ${account.profile.full_name || "учню"}!`}
      subtitle="Ваші заняття, домашні завдання та відгуки викладача."
      role={account.role}
    >
      {isLoading ? (
        <p className="text-muted-foreground">Завантажуємо...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Залишок занять" value={data?.balance ?? 0} hint="За оплаченими пакетами" />
            <StatCard label="Найближче заняття" value={upcoming[0] ? formatLessonDate(upcoming[0].starts_at) : "—"} />
            <StatCard label="Проведено занять" value={lessons.filter((l) => l.status === "completed").length} />
          </div>

          <Tabs defaultValue="calendar" className="mt-8">
            <TabsList className="rounded-full">
              <TabsTrigger value="calendar" className="rounded-full">Розклад</TabsTrigger>
              <TabsTrigger value="homework" className="rounded-full">Домашні завдання</TabsTrigger>
              <TabsTrigger value="payments" className="rounded-full">Оплата</TabsTrigger>
              <TabsTrigger value="profile" className="rounded-full">Профіль</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-6 space-y-6">
              <section>
                <h2 className="font-display text-lg font-semibold">Найближчі заняття</h2>
                {upcoming.length === 0 ? (
                  <p className="mt-2 text-muted-foreground">
                    Запланованих занять поки немає. Адміністратор призначить їх найближчим часом.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-3">
                    {upcoming.map((l) => (
                      <LessonRow key={l.id} lesson={l} />
                    ))}
                  </div>
                )}
              </section>
              <section>
                <h2 className="font-display text-lg font-semibold">Минулі заняття</h2>
                {past.length === 0 ? (
                  <p className="mt-2 text-muted-foreground">Поки що порожньо.</p>
                ) : (
                  <div className="mt-3 grid gap-3">
                    {past.map((l) => (
                      <LessonRow key={l.id} lesson={l} />
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>

            <TabsContent value="homework" className="mt-6">
              {withHomework.length === 0 ? (
                <p className="text-muted-foreground">Домашніх завдань поки немає.</p>
              ) : (
                <div className="grid gap-3">
                  {withHomework.map((l) => {
                    const r = l.lesson_reports[0]!;
                    return (
                      <Card key={l.id} className="rounded-2xl border-border/60">
                        <CardContent className="p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium">{r.topic || "Заняття"}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatLessonDate(l.starts_at)}
                            </p>
                          </div>
                          {r.homework && (
                            <p className="mt-3 whitespace-pre-line text-sm">
                              <span className="font-medium">Домашнє завдання: </span>
                              {r.homework}
                            </p>
                          )}
                          {r.feedback && (
                            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                              <span className="font-medium text-foreground">Відгук викладача: </span>
                              {r.feedback}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="payments" className="mt-6">
              <p className="text-muted-foreground">
                Залишок занять: <span className="font-medium text-foreground">{data?.balance ?? 0}</span>
              </p>
              <div className="mt-4 grid gap-3">
                {(data?.payments ?? []).length === 0 ? (
                  <p className="text-muted-foreground">Оплат поки немає.</p>
                ) : (
                  (data?.payments ?? []).map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-border/60 p-4"
                    >
                      <div>
                        <p className="font-medium">
                          {(p.packages as { name: string } | null)?.name ?? "Пакет занять"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {p.lessons_count} занять · {new Date(p.created_at).toLocaleDateString("uk-UA")}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{Number(p.amount).toFixed(0)} ₴</p>
                        <p className="text-xs text-muted-foreground">
                          {p.status === "paid" ? "Оплачено" : p.status === "pending" ? "В обробці" : "Не оплачено"}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="profile" className="mt-6">
              <ProfileForm account={account} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </CabinetShell>
  );
}

function LessonRow({ lesson }: { lesson: Lesson }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 p-4">
      <div>
        <p className="font-medium">
          {lesson.group_id ? `Група: ${lesson.groups?.name ?? "—"}` : "Індивідуальне заняття"}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatLessonDate(lesson.starts_at)} · {lesson.duration_min} хв
          {lesson.profiles?.full_name ? ` · викладач ${lesson.profiles.full_name}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={lesson.status} />
        {lesson.lesson_link && lesson.status === "scheduled" && (
          <Button asChild size="sm" className="rounded-full">
            <a href={lesson.lesson_link} target="_blank" rel="noreferrer">
              Приєднатися
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function ProfileForm({ account }: { account: Account }) {
  const save = useServerFn(updateMyProfile);
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState(account.profile.full_name);
  const [phone, setPhone] = useState(account.profile.phone ?? "");
  const [grade, setGrade] = useState(account.profile.grade?.toString() ?? "");

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          fullName,
          phone: phone || null,
          grade: grade ? Number(grade) : null,
        },
      }),
    onSuccess: () => {
      toast.success("Профіль збережено");
      queryClient.invalidateQueries({ queryKey: ["account"] });
    },
    onError: () => toast.error("Не вдалося зберегти профіль"),
  });

  return (
    <Card className="max-w-md rounded-2xl border-border/60">
      <CardContent className="space-y-4 p-6">
        <div className="grid gap-2">
          <Label htmlFor="pf-name">Імʼя та прізвище</Label>
          <Input id="pf-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pf-phone">Телефон</Label>
          <Input id="pf-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="pf-grade">Клас</Label>
          <select
            id="pf-grade"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">Не вказано</option>
            {Array.from({ length: 11 }, (_, i) => i + 1).map((g) => (
              <option key={g} value={g}>
                {g} клас
              </option>
            ))}
          </select>
        </div>
        <Button
          className="rounded-full"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          Зберегти
        </Button>
      </CardContent>
    </Card>
  );
}
