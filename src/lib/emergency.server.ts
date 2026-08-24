import { supabaseAdmin } from "@/integrations/supabase/client.server";

export type EmergencyInput = {
  studentUserId: string;
  summary: string;
  source: string;
  report: Record<string, unknown>;
  lat?: number | null;
  lng?: number | null;
  reason?: string | null;
  mentalStatus?: string | null;
  aiScore?: number | null;
};

export async function raiseEmergency(input: EmergencyInput) {
  const { data: student } = await supabaseAdmin
    .from("students")
    .select("*")
    .eq("user_id", input.studentUserId)
    .maybeSingle();

  const lat = input.lat ?? student?.last_lat ?? null;
  const lng = input.lng ?? student?.last_lng ?? null;

  // Find the nearest available counsellor (falls back to any available one).
  const { data: counsellors } = await supabaseAdmin
    .from("counsellors")
    .select("user_id, full_name, city, lat, lng, is_available")
    .eq("is_available", true)
    .limit(50);

  const ranked = (counsellors ?? [])
    .map((c) => {
      const distance =
        lat != null && lng != null && c.lat != null && c.lng != null
          ? Math.hypot(c.lat - lat, c.lng - lng)
          : Number.POSITIVE_INFINITY;
      return { ...c, distance };
    })
    .sort((a, b) => a.distance - b.distance);

  const nearest = ranked[0] ?? null;

  const contacts = [
    student?.parent_name
      ? { type: "parent", name: student.parent_name, phone: student.parent_mobile }
      : null,
    student?.friend_name
      ? { type: "best_friend", name: student.friend_name, phone: student.friend_mobile }
      : null,
    student?.emergency_contact
      ? { type: "emergency_contact", name: "Emergency contact", phone: student.emergency_contact }
      : null,
    nearest ? { type: "counsellor", name: nearest.full_name, phone: null } : null,
  ].filter(Boolean);

  const { data: alert, error } = await supabaseAdmin
    .from("emergency_alerts")
    .insert({
      student_user_id: input.studentUserId,
      counsellor_user_id: nearest?.user_id ?? null,
      risk: "level_3",
      trigger_source: input.source,
      summary: input.summary,
      report: input.report as never,
      lat,
      lng,
      contacts_notified: contacts as never,
      reason: input.reason ?? input.summary,
      mental_status: input.mentalStatus ?? "Severe distress — unstable",
      ai_score: input.aiScore ?? 80,
    })
    .select("id, room_id:id")
    .single();

  if (error) {
    console.error("[emergency] failed to create alert", error);
    throw new Error("Could not raise the emergency alert.");
  }

  let appointmentId: string | null = null;
  if (nearest) {
    const { data: appt, error: apptError } = await supabaseAdmin
      .from("appointments")
      .insert({
        student_user_id: input.studentUserId,
        counsellor_user_id: nearest.user_id,
        scheduled_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        mode: "video",
        status: "accepted",
        reason: "Automatic emergency consultation",
        is_emergency: true,
      })
      .select("id")
      .single();
    if (apptError) console.error("[emergency] auto-booking failed", apptError);
    appointmentId = appt?.id ?? null;

    await supabaseAdmin.from("notifications").insert({
      user_id: nearest.user_id,
      title: "🚨 Emergency alert",
      body: `${student?.full_name ?? "A student"} needs urgent support. ${input.summary}`,
      kind: "emergency",
    });
  }

  await supabaseAdmin.from("notifications").insert({
    user_id: input.studentUserId,
    title: "We reached out for you",
    body: nearest
      ? `We alerted your trusted contacts and connected you with ${nearest.full_name}. Help is on the way. 💙`
      : "We alerted your trusted contacts. You are not alone. 💙",
    kind: "emergency",
  });

  return { alertId: alert.id, appointmentId, counsellor: nearest, contacts, lat, lng };
}