import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const input = z.object({
  summary: z.string().trim().min(1).max(500),
  source: z.string().max(40).default("manual"),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  reason: z.string().max(300).nullable().optional(),
  mentalStatus: z.string().max(120).nullable().optional(),
  aiScore: z.number().min(0).max(100).nullable().optional(),
});

export const triggerEmergency = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => input.parse(raw))
  .handler(async ({ data, context }) => {
    const { raiseEmergency } = await import("./emergency.server");
    const result = await raiseEmergency({
      studentUserId: context.userId,
      summary: data.summary,
      source: data.source,
      report: { raisedBy: "student", at: new Date().toISOString() },
      lat: data.lat ?? null,
      lng: data.lng ?? null,
      reason: data.reason ?? null,
      mentalStatus: data.mentalStatus ?? null,
      aiScore: data.aiScore ?? null,
    });
    return {
      alertId: result.alertId,
      appointmentId: result.appointmentId,
      counsellorName: result.counsellor?.full_name ?? null,
      contacts: result.contacts,
    };
  });