import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const sendInput = z.object({
  recipientId: z.string().uuid(),
  content: z.string().trim().max(4000).default(""),
  kind: z.enum(["text", "image", "file", "voice"]).default("text"),
  attachmentPath: z.string().max(400).nullable().optional(),
  attachmentName: z.string().max(200).nullable().optional(),
  attachmentType: z.string().max(120).nullable().optional(),
});

export const sendDirectMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => sendInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.recipientId === userId) throw new Error("You cannot message yourself.");
    if (!data.content && !data.attachmentPath) throw new Error("Message is empty.");

    const { data: row, error } = await supabase
      .from("messages")
      .insert({
        sender_id: userId,
        recipient_id: data.recipientId,
        content: data.content,
        kind: data.kind,
        attachment_path: data.attachmentPath ?? null,
        attachment_name: data.attachmentName ?? null,
        attachment_type: data.attachmentType ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("notifications").insert({
      user_id: data.recipientId,
      title: "New message",
      body: data.content.slice(0, 120) || `Sent a ${data.kind}`,
      kind: "message",
    });

    return row;
  });

export const notifyMeetingStarted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) =>
    z.object({ peerId: z.string().uuid(), roomId: z.string().max(120) }).parse(raw),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("notifications").insert({
      user_id: data.peerId,
      title: "Video session started",
      body: "Your counsellor is waiting in the video room. Join from your appointments page.",
      kind: "meeting",
    });
    return { ok: true };
  });
