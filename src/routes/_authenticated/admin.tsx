import { createFileRoute } from "@tanstack/react-router";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  createGroup,
  createLesson,
  deleteLesson,
  getAdminDashboard,
  savePackage,
  setGroupMember,
  setPaymentStatus,
  setUserRole,
  updateRequestStatus,
} from "@/lib/admin.functions";
import { getMyAccount } from "@/lib/cabinet.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Адмін-панель — KATET SCHOOL" },
      {
        name: "description",
        content: "Керування заявками, учнями, викладачами, розкладом та оплатами KATET SCHOOL.",
      },
      { property: "og:title", content: "Адмін-панель — KATET SCHOOL" },
      { property: "og:description", content: "Керування онлайн-школою математики." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const requestStatusLabel: Record<string, string> = {
  new: "Нова",
  contacted: "Звʼязалися",
  assigned: "Призначено",
  closed: "Закрито",
};

function AdminPage() {
  const fetchAccount = useServerFn(getMyAccount);
  const fetchAdmin = useServerFn(getAdminDashboard);
  const queryClient = useQueryClient();

  const account = useQuery({ queryKey: ["account"], queryFn: () => fetchAccount() });
  const isAdmin = account.data?.role === "admin";

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => fetchAdmin(),
    enabled: isAdmin,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard"] });
  };

  if (account.isLoading) {
    return (
      <CabinetShell title="Адмін-панель" role="admin">
        <p className="text-muted-foreground">Завантажуємо...</p>
      </CabinetShell>
    );
  }

  if (!isAdmin) {
    return (
      <CabinetShell title="Адмін-панель" role={account.data?.role ?? "student"}>
        <p className="text-muted-foreground">Ця сторінка доступна лише адміністраторам школи.</p>
      </CabinetShell>
    );
  }

  const teachers = (data?.people ?? []).filter((p) => p.roles.includes("teacher"));
  const students = (data?.people ?? []).filter(
    (p) => !p.roles.includes("teacher") && !p.roles.includes("admin")
  );
  const newRequests = (data?.requests ?? []).filter((r) => r.status === "new").length;
  const nameOf = (id: string | null) =>
    (data?.people ?? []).find((p) => p.id === id)?.full_name || "—";

  return (
    <CabinetShell
      title="Адмін-панель"
      subtitle="Заявки, учні, викладачі, розклад, оплати та статистика."
      role="admin"
    >
      {isLoading ? (
        <p className="text-muted-foreground">Завантажуємо...</p>
      ) : error ? (
        <p className="text-destructive">Не вдалося завантажити дані.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Нові заявки" value={newRequests} />
            <StatCard label="Учнів" value={students.length} />
            <StatCard label="Викладачів" value={teachers.length} />
            <StatCard
              label="Занять заплановано"
              value={(data?.lessons ?? []).filter((l) => l.status === "scheduled").length}
            />
          </div>

          <Tabs defaultValue="requests" className="mt-8">
            <TabsList className="flex-wrap rounded-full">
              <TabsTrigger value="requests" className="rounded-full">Заявки</TabsTrigger>
              <TabsTrigger value="schedule" className="rounded-full">Розклад</TabsTrigger>
              <TabsTrigger value="people" className="rounded-full">Люди</TabsTrigger>
              <TabsTrigger value="groups" className="rounded-full">Групи</TabsTrigger>
              <TabsTrigger value="stats" className="rounded-full">Статистика</TabsTrigger>
              <TabsTrigger value="payments" className="rounded-full">Оплати</TabsTrigger>
            </TabsList>

            {/* Заявки */}
            <TabsContent value="requests" className="mt-6">
              {(data?.requests ?? []).length === 0 ? (
                <p className="text-muted-foreground">Заявок поки немає.</p>
              ) : (
                <div className="grid gap-3">
                  {(data?.requests ?? []).map((r) => (
                    <RequestCard key={r.id} request={r} onDone={refresh} />
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Розклад */}
            <TabsContent value="schedule" className="mt-6 space-y-8">
              <NewLessonForm
                teachers={teachers}
                students={students}
                groups={data?.groups ?? []}
                onDone={refresh}
              />
              <section>
                <h2 className="font-display text-lg font-semibold">Усі заняття</h2>
                <div className="mt-3 grid gap-3">
                  {(data?.lessons ?? []).length === 0 ? (
                    <p className="text-muted-foreground">Занять поки немає.</p>
                  ) : (
                    (data?.lessons ?? []).map((l) => (
                      <AdminLessonRow
                        key={l.id}
                        lesson={l}
                        groupName={(data?.groups ?? []).find((g) => g.id === l.group_id)?.name}
                        studentName={nameOf(l.student_id)}
                        teacherName={nameOf(l.teacher_id)}
                        onDone={refresh}
                      />
                    ))
                  )}
                </div>
              </section>
            </TabsContent>

            {/* Люди */}
            <TabsContent value="people" className="mt-6">
              <p className="mb-4 text-sm text-muted-foreground">
                Щоб зробити людину викладачем або адміністратором, спершу вона має
                зареєструватися на сайті.
              </p>
              <div className="overflow-x-auto rounded-2xl border border-border/60">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Імʼя</TableHead>
                      <TableHead>Телефон</TableHead>
                      <TableHead>Клас</TableHead>
                      <TableHead>Ролі</TableHead>
                      <TableHead className="text-right">Дії</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.people ?? []).map((p) => (
                      <PersonRow key={p.id} person={p} onDone={refresh} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            {/* Групи */}
            <TabsContent value="groups" className="mt-6 space-y-8">
              <NewGroupForm teachers={teachers} onDone={refresh} />
              <div className="grid gap-4 md:grid-cols-2">
                {(data?.groups ?? []).map((g) => (
                  <GroupCard
                    key={g.id}
                    group={g}
                    teacherName={nameOf(g.teacher_id)}
                    students={students}
                    members={(data?.members ?? [])
                      .filter((m) => m.group_id === g.id)
                      .map((m) => m.student_id)}
                    onDone={refresh}
                  />
                ))}
              </div>
            </TabsContent>

            {/* Статистика */}
            <TabsContent value="stats" className="mt-6 space-y-10">
              <section>
                <h2 className="font-display text-lg font-semibold">Учні та їхні заняття</h2>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Учень</TableHead>
                        <TableHead>Клас</TableHead>
                        <TableHead>Телефон</TableHead>
                        <TableHead>Усього занять</TableHead>
                        <TableHead>Проведено</TableHead>
                        <TableHead>Заплановано</TableHead>
                        <TableHead>Залишок</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.studentStats ?? []).map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.fullName || "—"}</TableCell>
                          <TableCell>{s.grade ?? "—"}</TableCell>
                          <TableCell>{s.phone ?? "—"}</TableCell>
                          <TableCell>{s.totalLessons}</TableCell>
                          <TableCell>{s.completedLessons}</TableCell>
                          <TableCell>{s.upcomingLessons}</TableCell>
                          <TableCell>{s.balance}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              <section>
                <h2 className="font-display text-lg font-semibold">
                  Заняття викладачів за останні 2 тижні
                </h2>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-border/60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Викладач</TableHead>
                        <TableHead>Проведено за 2 тижні</TableHead>
                        <TableHead>Проведено всього</TableHead>
                        <TableHead>Заплановано</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.teacherStats ?? []).map((t) => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium">{t.fullName || "—"}</TableCell>
                          <TableCell>{t.completedTwoWeeks}</TableCell>
                          <TableCell>{t.completedTotal}</TableCell>
                          <TableCell>{t.upcoming}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>
            </TabsContent>

            {/* Оплати */}
            <TabsContent value="payments" className="mt-6 space-y-8">
              <PackagesBlock packages={data?.packages ?? []} onDone={refresh} />
              <section>
                <h2 className="font-display text-lg font-semibold">Платежі</h2>
                {(data?.payments ?? []).length === 0 ? (
                  <p className="mt-2 text-muted-foreground">Платежів поки немає.</p>
                ) : (
                  <div className="mt-3 grid gap-3">
                    {(data?.payments ?? []).map((p) => (
                      <PaymentRow
                        key={p.id}
                        payment={p}
                        studentName={nameOf(p.student_id)}
                        onDone={refresh}
                      />
                    ))}
                  </div>
                )}
              </section>
            </TabsContent>
          </Tabs>
        </>
      )}
    </CabinetShell>
  );
}

/* ---------- підкомпоненти ---------- */

type Person = { id: string; full_name: string; phone: string | null; grade: number | null; roles: string[] };

function RequestCard({
  request,
  onDone,
}: {
  request: {
    id: string;
    student_name: string;
    contact: string;
    grade: number | null;
    goal: string;
    format: string;
    preferred_time: string | null;
    status: string;
    created_at: string;
  };
  onDone: () => void;
}) {
  const update = useServerFn(updateRequestStatus);
  const mutation = useMutation({
    mutationFn: (status: "new" | "contacted" | "assigned" | "closed") =>
      update({ data: { requestId: request.id, status } }),
    onSuccess: () => {
      toast.success("Статус оновлено");
      onDone();
    },
    onError: () => toast.error("Не вдалося оновити заявку"),
  });

  return (
    <Card className="rounded-2xl border-border/60">
      <CardContent className="p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-medium">
            {request.student_name}
            {request.grade ? ` · ${request.grade} клас` : ""}
          </p>
          <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
            {requestStatusLabel[request.status] ?? request.status}
          </span>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {request.contact} · {request.format === "group" ? "групові" : "індивідуальні"}
          {request.preferred_time ? ` · ${request.preferred_time}` : ""}
        </p>
        {request.goal && <p className="mt-2 text-sm">{request.goal}</p>}
        <div className="mt-4 flex flex-wrap gap-2">
          {(["contacted", "assigned", "closed"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => mutation.mutate(s)}
              disabled={mutation.isPending || request.status === s}
            >
              {requestStatusLabel[s]}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PersonRow({ person, onDone }: { person: Person; onDone: () => void }) {
  const setRole = useServerFn(setUserRole);
  const mutation = useMutation({
    mutationFn: (vars: { role: "teacher" | "admin"; enabled: boolean }) =>
      setRole({ data: { userId: person.id, role: vars.role, enabled: vars.enabled } }),
    onSuccess: () => {
      toast.success("Ролі оновлено");
      onDone();
    },
    onError: () => toast.error("Не вдалося змінити роль"),
  });

  const isTeacher = person.roles.includes("teacher");
  const isAdmin = person.roles.includes("admin");

  return (
    <TableRow>
      <TableCell className="font-medium">{person.full_name || "—"}</TableCell>
      <TableCell>{person.phone ?? "—"}</TableCell>
      <TableCell>{person.grade ?? "—"}</TableCell>
      <TableCell>
        {isAdmin ? "Адміністратор" : isTeacher ? "Викладач" : "Учень"}
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ role: "teacher", enabled: !isTeacher })}
          >
            {isTeacher ? "Зняти викладача" : "Зробити викладачем"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="rounded-full"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate({ role: "admin", enabled: !isAdmin })}
          >
            {isAdmin ? "Зняти адміна" : "Зробити адміном"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function NewLessonForm({
  teachers,
  students,
  groups,
  onDone,
}: {
  teachers: Person[];
  students: Person[];
  groups: { id: string; name: string }[];
  onDone: () => void;
}) {
  const create = useServerFn(createLesson);
  const [teacherId, setTeacherId] = useState("");
  const [target, setTarget] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [duration, setDuration] = useState("60");
  const [link, setLink] = useState("");

  const mutation = useMutation({
    mutationFn: () => {
      const isGroup = target.startsWith("g:");
      return create({
        data: {
          teacherId,
          studentId: isGroup ? null : target.replace("s:", ""),
          groupId: isGroup ? target.replace("g:", "") : null,
          startsAt,
          durationMin: Number(duration),
          lessonLink: link || null,
        },
      });
    },
    onSuccess: () => {
      toast.success("Заняття створено");
      setStartsAt("");
      setLink("");
      onDone();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Не вдалося створити заняття"),
  });

  return (
    <Card className="rounded-2xl border-border/60">
      <CardContent className="p-6">
        <h2 className="font-display text-lg font-semibold">Призначити заняття</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="al-teacher">Викладач</Label>
            <select
              id="al-teacher"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Оберіть викладача</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.id}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="al-target">Учень або група</Label>
            <select
              id="al-target"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Оберіть</option>
              <optgroup label="Учні">
                {students.map((s) => (
                  <option key={s.id} value={`s:${s.id}`}>
                    {s.full_name || s.id}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Групи">
                {groups.map((g) => (
                  <option key={g.id} value={`g:${g.id}`}>
                    {g.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="al-date">Дата і час</Label>
            <Input
              id="al-date"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="al-dur">Тривалість (хв)</Label>
            <Input
              id="al-dur"
              type="number"
              min={15}
              max={240}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="al-link">Посилання на заняття</Label>
            <Input
              id="al-link"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://meet.google.com/..."
            />
          </div>
        </div>
        <Button
          className="mt-5 rounded-full"
          disabled={!teacherId || !target || !startsAt || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Створити заняття
        </Button>
      </CardContent>
    </Card>
  );
}

function AdminLessonRow({
  lesson,
  groupName,
  studentName,
  teacherName,
  onDone,
}: {
  lesson: {
    id: string;
    starts_at: string;
    duration_min: number;
    status: string;
    group_id: string | null;
  };
  groupName?: string | undefined;
  studentName: string;
  teacherName: string;
  onDone: () => void;
}) {
  const remove = useServerFn(deleteLesson);
  const mutation = useMutation({
    mutationFn: () => remove({ data: { lessonId: lesson.id } }),
    onSuccess: () => {
      toast.success("Заняття видалено");
      onDone();
    },
    onError: () => toast.error("Не вдалося видалити заняття"),
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 p-4">
      <div>
        <p className="font-medium">
          {lesson.group_id ? `Група: ${groupName ?? "—"}` : studentName} · викладач {teacherName}
        </p>
        <p className="text-sm text-muted-foreground">
          {formatLessonDate(lesson.starts_at)} · {lesson.duration_min} хв
        </p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={lesson.status} />
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          Видалити
        </Button>
      </div>
    </div>
  );
}

function NewGroupForm({ teachers, onDone }: { teachers: Person[]; onDone: () => void }) {
  const create = useServerFn(createGroup);
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [teacherId, setTeacherId] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      create({
        data: {
          name,
          grade: grade ? Number(grade) : null,
          teacherId: teacherId || null,
        },
      }),
    onSuccess: () => {
      toast.success("Групу створено");
      setName("");
      onDone();
    },
    onError: () => toast.error("Не вдалося створити групу"),
  });

  return (
    <Card className="rounded-2xl border-border/60">
      <CardContent className="p-6">
        <h2 className="font-display text-lg font-semibold">Нова група</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="ag-name">Назва</Label>
            <Input id="ag-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ag-grade">Клас</Label>
            <Input
              id="ag-grade"
              type="number"
              min={1}
              max={11}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ag-teacher">Викладач</Label>
            <select
              id="ag-teacher"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className="h-10 rounded-md border border-input bg-transparent px-3 text-sm"
            >
              <option value="">Без викладача</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || t.id}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button
          className="mt-5 rounded-full"
          disabled={!name || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          Створити групу
        </Button>
      </CardContent>
    </Card>
  );
}

function GroupCard({
  group,
  teacherName,
  students,
  members,
  onDone,
}: {
  group: { id: string; name: string; grade: number | null };
  teacherName: string;
  students: Person[];
  members: string[];
  onDone: () => void;
}) {
  const toggle = useServerFn(setGroupMember);
  const mutation = useMutation({
    mutationFn: (vars: { studentId: string; member: boolean }) =>
      toggle({ data: { groupId: group.id, studentId: vars.studentId, member: vars.member } }),
    onSuccess: () => onDone(),
    onError: () => toast.error("Не вдалося змінити склад групи"),
  });

  return (
    <Card className="rounded-2xl border-border/60">
      <CardContent className="p-5">
        <p className="font-medium">{group.name}</p>
        <p className="text-sm text-muted-foreground">
          {group.grade ? `${group.grade} клас · ` : ""}викладач {teacherName}
        </p>
        <div className="mt-4 space-y-2">
          {students.map((s) => {
            const isMember = members.includes(s.id);
            return (
              <div key={s.id} className="flex items-center justify-between gap-2">
                <span className="text-sm">{s.full_name || s.id}</span>
                <Button
                  size="sm"
                  variant={isMember ? "secondary" : "outline"}
                  className="rounded-full"
                  disabled={mutation.isPending}
                  onClick={() => mutation.mutate({ studentId: s.id, member: !isMember })}
                >
                  {isMember ? "У групі" : "Додати"}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PackagesBlock({
  packages,
  onDone,
}: {
  packages: { id: string; name: string; lessons_count: number; price: number; active: boolean }[];
  onDone: () => void;
}) {
  const save = useServerFn(savePackage);
  const [name, setName] = useState("");
  const [count, setCount] = useState("8");
  const [price, setPrice] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      save({
        data: {
          id: null,
          name,
          lessonsCount: Number(count),
          price: Number(price),
          active: true,
        },
      }),
    onSuccess: () => {
      toast.success("Пакет збережено");
      setName("");
      setPrice("");
      onDone();
    },
    onError: () => toast.error("Не вдалося зберегти пакет"),
  });

  return (
    <section>
      <h2 className="font-display text-lg font-semibold">Пакети занять</h2>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        {packages.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border/60 p-4">
            <p className="font-medium">{p.name}</p>
            <p className="text-sm text-muted-foreground">
              {p.lessons_count} занять · {Number(p.price).toFixed(0)} ₴
            </p>
          </div>
        ))}
      </div>
      <Card className="mt-4 rounded-2xl border-border/60">
        <CardContent className="p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="pk-name">Назва пакета</Label>
              <Input id="pk-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pk-count">Кількість занять</Label>
              <Input
                id="pk-count"
                type="number"
                min={1}
                value={count}
                onChange={(e) => setCount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="pk-price">Ціна, ₴</Label>
              <Input
                id="pk-price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="mt-4 rounded-full"
            disabled={!name || !price || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Додати пакет
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function PaymentRow({
  payment,
  studentName,
  onDone,
}: {
  payment: {
    id: string;
    amount: number;
    lessons_count: number;
    status: string;
    created_at: string;
  };
  studentName: string;
  onDone: () => void;
}) {
  const update = useServerFn(setPaymentStatus);
  const mutation = useMutation({
    mutationFn: (status: "pending" | "paid" | "failed") =>
      update({ data: { paymentId: payment.id, status } }),
    onSuccess: () => {
      toast.success("Статус оплати оновлено");
      onDone();
    },
    onError: () => toast.error("Не вдалося оновити оплату"),
  });

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 p-4">
      <div>
        <p className="font-medium">{studentName}</p>
        <p className="text-sm text-muted-foreground">
          {payment.lessons_count} занять · {Number(payment.amount).toFixed(0)} ₴ ·{" "}
          {new Date(payment.created_at).toLocaleDateString("uk-UA")}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
          {payment.status === "paid" ? "Оплачено" : payment.status === "pending" ? "В обробці" : "Помилка"}
        </span>
        {payment.status !== "paid" && (
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => mutation.mutate("paid")}
            disabled={mutation.isPending}
          >
            Позначити оплаченим
          </Button>
        )}
      </div>
    </div>
  );
}
