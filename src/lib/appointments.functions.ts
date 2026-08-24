import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const createInput = z.object({
  counsellorUserId: z.string().uuid(),
  studentUserId: z.string().uuid(),
  scheduledAt: z.string().min(4),
  mode: z.enum(["video", "voice", "chat", "in_person"]),
  purpose: z.string().trim().max(200).optional().default(""),
  notes: z.string().trim().max(2000).optional().default(""),
});

export const createAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => createInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const isCounsellor = userId === data.counsellorUserId;
    if (!isCounsellor && userId !== data.studentUserId) {
      throw new Error("You can only book your own sessions.");
    }

    const when = new Date(data.scheduledAt);
    if (Number.isNaN(when.getTime())) throw new Error("Please choose a valid date and time.");

    const { data: appt, error } = await supabase
      .from("appointments")
      .insert({
        student_user_id: data.studentUserId,
        counsellor_user_id: data.counsellorUserId,
        scheduled_at: when.toISOString(),
        mode: data.mode,
        status: isCounsellor ? "accepted" : "pending",
        reason: data.purpose || null,
        purpose: data.purpose || null,
        notes: data.notes || null,
      })
      .select("id, room_id, scheduled_at")
      .single();

    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const target = isCounsellor ? data.studentUserId : data.counsellorUserId;
    await supabaseAdmin.from("notifications").insert({
      user_id: target,
      title: isCounsellor ? "New appointment scheduled" : "New appointment request",
      body: `${when.toLocaleString()} · ${data.mode.replace("_", " ")} session${
        data.purpose ? ` · ${data.purpose}` : ""
      }`,
      kind: "appointment",
    });

    return appt;
  });

const statusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["accepted", "rejected", "completed", "cancelled", "pending"]),
  scheduledAt: z.string().optional(),
  rescheduleNote: z.string().max(300).optional(),
});

export const updateAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => statusInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing, error: readErr } = await supabase
      .from("appointments")
      .select("id, student_user_id, counsellor_user_id, scheduled_at")
      .eq("id", data.id)
      .maybeSingle();
    if (readErr || !existing) throw new Error("Appointment not found.");

    const patch: {
      status: typeof data.status;
      scheduled_at?: string;
      reschedule_requested_at?: string | null;
      reschedule_note?: string | null;
    } = { status: data.status };
    if (data.scheduledAt) {
      const when = new Date(data.scheduledAt);
      if (Number.isNaN(when.getTime())) throw new Error("Invalid date.");
      patch.scheduled_at = when.toISOString();
      patch.reschedule_requested_at = null;
      patch.reschedule_note = null;
    }
    const { error } = await supabase.from("appointments").update(patch).eq("id", data.id);
    if (error) throw new Error(error.message);

    const other =
      userId === existing.counsellor_user_id ? existing.student_user_id : existing.counsellor_user_id;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("notifications").insert({
      user_id: other,
      title: `Appointment ${data.status}`,
      body: `${new Date(patch.scheduled_at ?? existing.scheduled_at).toLocaleString()} — the session was marked ${data.status}.`,
      kind: "appointment",
    });
    return { ok: true };
  });

const rescheduleInput = z.object({ id: z.string().uuid(), note: z.string().trim().max(300) });

export const requestReschedule = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => rescheduleInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: existing } = await supabase
      .from("appointments")
      .select("id, student_user_id, counsellor_user_id")
      .eq("id", data.id)
      .maybeSingle();
    if (!existing) throw new Error("Appointment not found.");

    const { error } = await supabase
      .from("appointments")
      .update({ reschedule_requested_at: new Date().toISOString(), reschedule_note: data.note })
      .eq("id", data.id);
    if (error) throw new Error(error.message);

    const other =
      userId === existing.counsellor_user_id ? existing.student_user_id : existing.counsellor_user_id;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("notifications").insert({
      user_id: other,
      title: "Reschedule requested",
      body: data.note || "The other participant asked to move this session.",
      kind: "appointment",
    });
    return { ok: true };
  });
