import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Доступ лише для адміністратора");
}

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabase } = context;

    const [
      { data: requests },
      { data: profiles },
      { data: roles },
      { data: lessons },
      { data: groups },
      { data: members },
      { data: payments },
      { data: packages },
    ] = await Promise.all([
      supabase.from("lesson_requests").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name, phone, grade, created_at"),
      supabase.from("user_roles").select("user_id, role"),
      supabase
        .from("lessons")
        .select("id, starts_at, duration_min, format, status, lesson_link, student_id, teacher_id, group_id")
        .order("starts_at", { ascending: false }),
      supabase.from("groups").select("id, name, grade, teacher_id"),
      supabase.from("group_members").select("group_id, student_id"),
      supabase.from("payments").select("id, student_id, amount, lessons_count, status, created_at"),
      supabase.from("packages").select("*").order("lessons_count", { ascending: true }),
    ]);

    const roleMap = new Map<string, string[]>();
    for (const r of roles ?? []) {
      const list = roleMap.get(r.user_id) ?? [];
      list.push(r.role);
      roleMap.set(r.user_id, list);
    }

    const people = (profiles ?? []).map((p) => ({
      ...p,
      roles: roleMap.get(p.id) ?? ["student"],
    }));

    const allLessons = lessons ?? [];
    const memberList = members ?? [];
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;

    const studentStats = people
      .filter((p) => !p.roles.includes("teacher") && !p.roles.includes("admin"))
      .map((p) => {
        const groupIds = memberList.filter((m) => m.student_id === p.id).map((m) => m.group_id);
        const own = allLessons.filter(
          (l) => l.student_id === p.id || (l.group_id && groupIds.includes(l.group_id))
        );
        const paidLessons = (payments ?? [])
          .filter((pay) => pay.student_id === p.id && pay.status === "paid")
          .reduce((s, pay) => s + (pay.lessons_count ?? 0), 0);
        const completed = own.filter((l) => l.status === "completed").length;
        return {
          id: p.id,
          fullName: p.full_name,
          phone: p.phone,
          grade: p.grade,
          totalLessons: own.length,
          completedLessons: completed,
          upcomingLessons: own.filter((l) => l.status === "scheduled").length,
          balance: paidLessons - completed,
        };
      });

    const teacherStats = people
      .filter((p) => p.roles.includes("teacher"))
      .map((p) => {
        const own = allLessons.filter((l) => l.teacher_id === p.id);
        return {
          id: p.id,
          fullName: p.full_name,
          completedTwoWeeks: own.filter(
            (l) => l.status === "completed" && new Date(l.starts_at).getTime() >= twoWeeksAgo
          ).length,
          completedTotal: own.filter((l) => l.status === "completed").length,
          upcoming: own.filter((l) => l.status === "scheduled").length,
        };
      });

    return {
      requests: requests ?? [],
      people,
      lessons: allLessons,
      groups: groups ?? [],
      members: memberList,
      payments: payments ?? [],
      packages: packages ?? [],
      studentStats,
      teacherStats,
    };
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["student", "teacher", "admin"]),
        enabled: z.boolean(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase } = context;
    if (data.enabled) {
      await supabase.from("user_roles").upsert(
        { user_id: data.userId, role: data.role },
        { onConflict: "user_id,role" }
      );
      if (data.role === "teacher") {
        await supabase.from("teachers").upsert({ user_id: data.userId }, { onConflict: "user_id" });
      }
    } else {
      await supabase.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
      if (data.role === "teacher") {
        await supabase.from("teachers").delete().eq("user_id", data.userId);
      }
    }
    return { ok: true as const };
  });

export const updateRequestStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        requestId: z.string().uuid(),
        status: z.enum(["new", "contacted", "assigned", "closed"]),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("lesson_requests")
      .update({ status: data.status })
      .eq("id", data.requestId);
    if (error) throw new Error("Не вдалося оновити заявку");
    return { ok: true as const };
  });

export const createLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        teacherId: z.string().uuid(),
        studentId: z.string().uuid().nullable(),
        groupId: z.string().uuid().nullable(),
        startsAt: z.string().min(1),
        durationMin: z.number().int().min(15).max(240),
        lessonLink: z.string().trim().max(500).nullable(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (!data.studentId && !data.groupId) {
      throw new Error("Оберіть учня або групу");
    }
    const { error } = await context.supabase.from("lessons").insert({
      teacher_id: data.teacherId,
      student_id: data.groupId ? null : data.studentId,
      group_id: data.groupId,
      format: data.groupId ? "group" : "individual",
      starts_at: new Date(data.startsAt).toISOString(),
      duration_min: data.durationMin,
      lesson_link: data.lessonLink,
    });
    if (error) throw new Error("Не вдалося створити заняття");
    return { ok: true as const };
  });

export const deleteLesson = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ lessonId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("lessons").delete().eq("id", data.lessonId);
    return { ok: true as const };
  });

export const createGroup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        name: z.string().trim().min(1).max(120),
        grade: z.number().int().min(1).max(11).nullable(),
        teacherId: z.string().uuid().nullable(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("groups").insert({
      name: data.name,
      grade: data.grade,
      teacher_id: data.teacherId,
    });
    if (error) throw new Error("Не вдалося створити групу");
    return { ok: true as const };
  });

export const setGroupMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        groupId: z.string().uuid(),
        studentId: z.string().uuid(),
        member: z.boolean(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabase } = context;
    if (data.member) {
      await supabase
        .from("group_members")
        .upsert({ group_id: data.groupId, student_id: data.studentId }, { onConflict: "group_id,student_id" });
    } else {
      await supabase
        .from("group_members")
        .delete()
        .eq("group_id", data.groupId)
        .eq("student_id", data.studentId);
    }
    return { ok: true as const };
  });

export const savePackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid().nullable(),
        name: z.string().trim().min(1).max(120),
        lessonsCount: z.number().int().min(1).max(200),
        price: z.number().min(0),
        active: z.boolean(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row = {
      name: data.name,
      lessons_count: data.lessonsCount,
      price: data.price,
      active: data.active,
    };
    const { error } = data.id
      ? await context.supabase.from("packages").update(row).eq("id", data.id)
      : await context.supabase.from("packages").insert(row);
    if (error) throw new Error("Не вдалося зберегти пакет");
    return { ok: true as const };
  });

export const setPaymentStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        paymentId: z.string().uuid(),
        status: z.enum(["pending", "paid", "failed"]),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    await context.supabase.from("payments").update({ status: data.status }).eq("id", data.paymentId);
    return { ok: true as const };
  });
