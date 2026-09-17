import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Role = "student" | "teacher" | "admin";

export const getMyAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const [{ data: profile }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, phone, grade").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    const roleList = (roles ?? []).map((r) => r.role as Role);
    const role: Role = roleList.includes("admin")
      ? "admin"
      : roleList.includes("teacher")
        ? "teacher"
        : "student";
    return {
      userId,
      role,
      profile: profile ?? { id: userId, full_name: "", phone: null, grade: null },
    };
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        fullName: z.string().trim().min(1).max(120),
        phone: z.string().trim().max(60).nullable(),
        grade: z.number().int().min(1).max(11).nullable(),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .update({ full_name: data.fullName, phone: data.phone, grade: data.grade })
      .eq("id", context.userId);
    if (error) throw new Error("Не вдалося зберегти профіль");
    return { ok: true as const };
  });

/* ---------------- Учень ---------------- */

export const getStudentDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    const { data: memberships } = await supabase
      .from("group_members")
      .select("group_id, groups(id, name, grade)")
      .eq("student_id", userId);
    const groupIds = (memberships ?? []).map((m) => m.group_id);

    const filter = groupIds.length
      ? `student_id.eq.${userId},group_id.in.(${groupIds.join(",")})`
      : `student_id.eq.${userId}`;

    const { data: lessons } = await supabase
      .from("lessons")
      .select(
        "id, starts_at, duration_min, format, status, lesson_link, teacher_id, group_id, groups(name), profiles:teacher_id(full_name), lesson_reports(topic, homework, feedback)"
      )
      .or(filter)
      .order("starts_at", { ascending: true });

    const { data: payments } = await supabase
      .from("payments")
      .select("id, amount, lessons_count, status, created_at, packages(name)")
      .eq("student_id", userId)
      .order("created_at", { ascending: false });

    const paidLessons = (payments ?? [])
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + (p.lessons_count ?? 0), 0);
    const usedLessons = (lessons ?? []).filter((l) => l.status === "completed").length;

    return {
      lessons: lessons ?? [],
      payments: payments ?? [],
      groups: (memberships ?? []).map((m) => m.groups).filter(Boolean),
      balance: paidLessons - usedLessons,
    };
  });

/* ---------------- Викладач ---------------- */

export const getTeacherDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: lessons } = await supabase
      .from("lessons")
      .select(
        "id, starts_at, duration_min, format, status, lesson_link, student_id, group_id, groups(name), profiles:student_id(full_name), lesson_reports(id, topic, homework, feedback)"
      )
      .eq("teacher_id", userId)
      .order("starts_at", { ascending: true });

    const { data: groups } = await supabase
      .from("groups")
      .select("id, name, grade")
      .eq("teacher_id", userId);

    return { lessons: lessons ?? [], groups: groups ?? [] };
  });

export const saveLessonReport = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        lessonId: z.string().uuid(),
        topic: z.string().trim().max(300).default(""),
        homework: z.string().trim().max(3000).default(""),
        feedback: z.string().trim().max(3000).default(""),
        markCompleted: z.boolean().default(true),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { error } = await supabase.from("lesson_reports").upsert(
      {
        lesson_id: data.lessonId,
        topic: data.topic,
        homework: data.homework,
        feedback: data.feedback,
      },
      { onConflict: "lesson_id" }
    );
    if (error) throw new Error("Не вдалося зберегти звіт");
    if (data.markCompleted) {
      await supabase.from("lessons").update({ status: "completed" }).eq("id", data.lessonId);
    }
    return { ok: true as const };
  });

export const setLessonStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        lessonId: z.string().uuid(),
        status: z.enum(["scheduled", "completed", "cancelled"]),
      })
      .parse(d)
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("lessons")
      .update({ status: data.status })
      .eq("id", data.lessonId);
    if (error) throw new Error("Не вдалося змінити статус заняття");
    return { ok: true as const };
  });
