import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getMyAccount } from "@/lib/cabinet.functions";
import { StudentCabinet } from "@/components/cabinet/StudentCabinet";
import { TeacherCabinet } from "@/components/cabinet/TeacherCabinet";
import { CabinetShell } from "@/components/CabinetShell";

export const Route = createFileRoute("/_authenticated/cabinet")({
  head: () => ({
    meta: [
      { title: "Мій кабінет — KATET SCHOOL" },
      {
        name: "description",
        content: "Особистий кабінет KATET SCHOOL: розклад занять, домашні завдання, відгуки та оплата.",
      },
      { property: "og:title", content: "Мій кабінет — KATET SCHOOL" },
      { property: "og:description", content: "Розклад занять, домашні завдання та відгуки викладача." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CabinetPage,
});

function CabinetPage() {
  const fetchAccount = useServerFn(getMyAccount);
  const { data, isLoading } = useQuery({
    queryKey: ["account"],
    queryFn: () => fetchAccount(),
  });

  if (isLoading || !data) {
    return (
      <CabinetShell title="Мій кабінет" role="student">
        <p className="text-muted-foreground">Завантажуємо...</p>
      </CabinetShell>
    );
  }

  if (data.role === "admin") {
    return (
      <CabinetShell
        title="Кабінет адміністратора"
        subtitle="Керуйте заявками, людьми, розкладом та оплатами школи."
        role="admin"
      >
        <Link
          to="/admin"
          className="inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Відкрити адмін-панель
        </Link>
      </CabinetShell>
    );
  }
  if (data.role === "teacher") return <TeacherCabinet account={data} />;
  return <StudentCabinet account={data} />;
}

