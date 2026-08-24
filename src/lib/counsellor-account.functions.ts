import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const deleteInput = z.object({
  password: z.string().min(1).max(200),
  confirm: z.string(),
  reason: z.string().trim().max(500).optional().default(""),
});

export const deleteCounsellorAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((raw: unknown) => deleteInput.parse(raw))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.confirm !== "DELETE") throw new Error('Please type DELETE to confirm.');

    const { data: isCounsellor } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "counsellor",
    });
    if (!isCounsellor) throw new Error("Only counsellor accounts can be deleted here.");

    const { data: profile } = await supabase
      .from("counsellors")
      .select("full_name, email")
      .eq("user_id", userId)
      .maybeSingle();
    if (!profile) throw new Error("Counsellor profile not found.");

    // verify the current password before doing anything destructive
    const { createClient } = await import("@supabase/supabase-js");
    const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
    const verifier = createClient(process.env["SUPABASE_URL"]!, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => {
          const h = new Headers(init?.headers);
          if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
            h.delete("Authorization");
          h.set("apikey", key);
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    const { error: pwErr } = await verifier.auth.signInWithPassword({
      email: profile.email,
      password: data.password,
    });
    if (pwErr) throw new Error("Incorrect password.");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // 1. deactivate the profile so the directory hides it immediately
    await supabaseAdmin
      .from("counsellors")
      .update({ is_deleted: true, is_available: false, profile_public: false })
      .eq("user_id", userId);

    // 2. cancel upcoming appointments and notify each affected student
    const nowIso = new Date().toISOString();
    const { data: upcoming } = await supabaseAdmin
      .from("appointments")
      .select("id, student_user_id, scheduled_at")
      .eq("counsellor_user_id", userId)
      .gte("scheduled_at", nowIso)
      .in("status", ["pending", "accepted"]);

    if (upcoming?.length) {
      await supabaseAdmin
        .from("appointments")
        .update({ status: "cancelled", notes: "Cancelled by counsellor (account closed)" })
        .in(
          "id",
          upcoming.map((a) => a.id),
        );
      await supabaseAdmin.from("notifications").insert(
        upcoming.map((a) => ({
          user_id: a.student_user_id,
          title: "Appointment cancelled",
          body: `Your counsellor account is no longer available. Your appointment on ${new Date(
            a.scheduled_at,
          ).toLocaleString()} has been cancelled. Please choose another counsellor.`,
          kind: "appointment",
        })),
      );
    }

    // 3. clear chat history, uploaded files and notifications
    const { data: files } = await supabaseAdmin.storage.from("chat-files").list(userId);
    if (files?.length) {
      await supabaseAdmin.storage
        .from("chat-files")
        .remove(files.map((f) => `${userId}/${f.name}`));
    }
    await supabaseAdmin.from("messages").delete().or(`sender_id.eq.${userId},recipient_id.eq.${userId}`);
    await supabaseAdmin.from("notifications").delete().eq("user_id", userId);

    // 4. audit record for admins
    await supabaseAdmin.from("account_deletions").insert({
      user_id: userId,
      role: "counsellor",
      full_name: profile.full_name,
      email: profile.email,
      reason: data.reason || null,
    });

    // 5. remove the login account
    const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (delErr) throw new Error(delErr.message);

    return { ok: true, cancelled: upcoming?.length ?? 0 };
  });