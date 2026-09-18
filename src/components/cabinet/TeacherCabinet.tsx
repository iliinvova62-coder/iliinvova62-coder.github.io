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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getTeacherDashboard,
  saveLessonReport,
  setLessonStatus,
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
  lesson_reports: { id: string; topic: string | null; homework: string | null; feedback: string | null }[];
};

export function TeacherCabinet({ account }: { account: Account }) {
  const fetchDashboard = useServerFn(getTeacherDashboard);
  const { data, isLoading } = useQuery({
    queryKey: ["teacher-dashboard"],
    queryFn: () => fetchDashboard(),
  });
  const [reportFor, setReportFor] = useState<Lesson | null>(null);

  const lessons = (data?.lessons ?? []) as unknown as Lesson[];
  const now = Date.now();
  const upcoming = lessons.filter(
    (l) => l.status === "scheduled" && new Date(l.starts_at).getTime() >= now
  );
  const needReport = lessons.filter(
    (l) => l.status === "scheduled" && new Date(l.starts_at).getTime() < now
  );
  const done = lessons.filter((l) => l.status !== "scheduled").reverse();

  const twoWeeksAgo = now - 14 * 24 * 60 * 60 * 1000;
  const lastTwoWeeks = lessons.filter(
    (l) => l.status === "completed" && new Date(l.starts_at).getTime() >= twoWeeksAgo
  ).length;

  return (
    <CabinetShell
      title={`Кабінет викладача`}
      subtitle={account.profile.full_name || undefined}
      role={account.role}
    >
      {isLoading ? (
        <p className="text-muted-foreground">Завантажуємо...</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Заплановано занять" value={upcoming.length} />
            <StatCard label="Очікують звіту" value={needReport.length} />
            <StatCard label="Проведено за 2 тижні" value={lastTwoWeeks} />
          </div>

          <Tabs defaultValue="schedule" className="mt-8">
            <TabsList className="rounded-full">
              <TabsTrigger value="schedule" className="rounded-full">Розклад</TabsTrigger>
              <TabsTrigger value="reports" className="rounded-full">Звіти</TabsTrigger>
              <TabsTrigger value="groups" className="rounded-full">Групи</TabsTrigger>
            </TabsList>

            <TabsContent value="schedule" className="mt-6 space-y-6">
              {needReport.length > 0 && (
                <section>
                  <h2 className="font-display text-lg font-semibold">Потрібен звіт</h2>
                  <div className="mt-3 grid gap-3">
                    {needReport.map((l) => (
                      <TeacherLessonRow key={l.id} lesson={l} onReport={() => setReportFor(l)} />
                    ))}
                  </div>
                </section>
              )}
              <section>
                <h2 className="font-display text-lg font-semibold">Найближчі заняття</h2>
                {upcoming.length === 0 ? (
                  <p className="mt-2 text-muted-foreground">Запланованих занять немає.</p>
                ) : (
                  <div className="mt-3 grid gap-3">
                    {upcoming.map((l) => (
                      <TeacherLessonRow key={l.id} lesson={l} onReport={() => setReportFor(l)} />
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>

            <TabsContent value="reports" className="mt-6">
              {done.length === 0 ? (
                <p className="text-muted-foreground">Проведених занять поки немає.</p>
              ) : (
                <div className="grid gap-3">
                  {done.map((l) => {
                    const r = l.lesson_reports?.[0];
                    return (
                      <Card key={l.id} className="rounded-2xl border-border/60">
                        <CardContent className="p-5">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium">
                              {l.group_id ? l.groups?.name : l.profiles?.full_name}
                            </p>
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground">
                                {formatLessonDate(l.starts_at)}
                              </span>
                              <StatusBadge status={l.status} />
                            </div>
                          </div>
                          {r ? (
                            <div className="mt-3 space-y-1 text-sm">
                              {r.topic && <p><span className="font-medium">Тема: </span>{r.topic}</p>}
                              {r.homework && <p><span className="font-medium">ДЗ: </span>{r.homework}</p>}
                              {r.feedback && (
                                <p className="text-muted-foreground">
                                  <span className="font-medium text-foreground">Відгук: </span>{r.feedback}
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-muted-foreground">Звіт не заповнено.</p>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 rounded-full"
                            onClick={() => setReportFor(l)}
                          >
                            {r ? "Редагувати звіт" : "Заповнити звіт"}
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="groups" className="mt-6">
              {(data?.groups ?? []).length === 0 ? (
                <p className="text-muted-foreground">Груп поки немає.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {(data?.groups ?? []).map((g) => (
                    <div key={g.id} className="rounded-2xl border border-border/60 p-5">
                      <p className="font-medium">{g.name}</p>
                      {g.grade && <p className="text-sm text-muted-foreground">{g.grade} клас</p>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          <ReportDialog lesson={reportFor} onClose={() => setReportFor(null)} />
        </>
      )}
    </CabinetShell>
  );
}

function TeacherLessonRow({ lesson, onReport }: { lesson: Lesson; onReport: () => void }) {
  const queryClient = useQueryClient();
  const changeStatus = useServerFn(setLessonStatus);
  const cancel = useMutation({
    mutationFn: () => changeStatus({ data: { lessonId: lesson.id, status: "cancelled" } }),
    onSuccess: () => {
      toast.success("Заняття скасовано");
      queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
    },
    onError: () => toast.error("Не вдалося змінити статус"),
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 p-4">
      <div>
        <p className="font-medium">
          {lesson.group_id ? `Група: ${lesson.groups?.name ?? "—"}` : lesson.profiles?.full_name ?? "Учень"}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatLessonDate(lesson.starts_at)} · {lesson.duration_min} хв
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={lesson.status} />
        {lesson.lesson_link && (
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <a href={lesson.lesson_link} target="_blank" rel="noreferrer">Посилання</a>
          </Button>
        )}
        <Button size="sm" className="rounded-full" onClick={onReport}>
          Звіт
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={() => cancel.mutate()}
          disabled={cancel.isPending}
        >
          Скасувати
        </Button>
      </div>
    </div>
  );
}

function ReportDialog({ lesson, onClose }: { lesson: Lesson | null; onClose: () => void }) {
  const save = useServerFn(saveLessonReport);
  const queryClient = useQueryClient();
  const existing = lesson?.lesson_reports?.[0];
  const [topic, setTopic] = useState("");
  const [homework, setHomework] = useState("");
  const [feedback, setFeedback] = useState("");
  const [lessonId, setLessonId] = useState<string | null>(null);

  if (lesson && lesson.id !== lessonId) {
    setLessonId(lesson.id);
    setTopic(existing?.topic ?? "");
    setHomework(existing?.homework ?? "");
    setFeedback(existing?.feedback ?? "");
  }

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          lessonId: lesson!.id,
          topic,
          homework,
          feedback,
          markCompleted: true,
        },
      }),
    onSuccess: () => {
      toast.success("Звіт збережено");
      queryClient.invalidateQueries({ queryKey: ["teacher-dashboard"] });
      onClose();
    },
    onError: () => toast.error("Не вдалося зберегти звіт"),
  });

  return (
    <Dialog open={!!lesson} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Звіт після заняття</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="rp-topic">Тема заняття</Label>
            <Input id="rp-topic" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rp-hw">Домашнє завдання</Label>
            <Textarea id="rp-hw" rows={3} value={homework} onChange={(e) => setHomework(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="rp-fb">Як пройшло заняття</Label>
            <Textarea id="rp-fb" rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)} />
          </div>
          <Button
            className="w-full rounded-full"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            Зберегти і позначити як проведене
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
