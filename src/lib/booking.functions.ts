import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

const requestSchema = z.object({
  studentName: z.string().trim().min(2, "Вкажіть імʼя").max(120),
  contact: z.string().trim().min(3, "Вкажіть телефон або Telegram").max(160),
  grade: z.number().int().min(1).max(11).nullable(),
  goal: z.string().trim().max(1000).default(""),
  format: z.enum(["individual", "group"]),
  preferredTime: z.string().trim().max(200).default(""),
});

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
  });
}

export const submitLessonRequest = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => requestSchema.parse(data))
  .handler(async ({ data }) => {
    const supabasePublic = publicClient();
    const { error } = await supabasePublic.from("lesson_requests").insert({
      student_name: data.studentName,
      contact: data.contact,
      grade: data.grade,
      goal: data.goal,
      format: data.format,
      preferred_time: data.preferredTime,
    });
    if (error) {
      console.error("lesson_request insert failed", error.message);
      throw new Error("Не вдалося надіслати заявку. Спробуйте ще раз.");
    }
    return { ok: true as const };
  });
