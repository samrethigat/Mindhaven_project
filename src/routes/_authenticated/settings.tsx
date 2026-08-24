import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

const PERMS = [
  ["perm_location", "Location"],
  ["perm_camera", "Camera"],
  ["perm_microphone", "Microphone"],
  ["perm_notification", "Notifications"],
  ["perm_storage", "Files"],
] as const;

function SettingsPage() {
  const { user, isCounsellor } = useAuth();
  const navigate = useNavigate();
  const [student, setStudent] = useState<Record<string, unknown> | null>(null);
  const [counsellor, setCounsellor] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      if (isCounsellor) {
        const { data } = await supabase.from("counsellors").select("*").eq("user_id", user.id).maybeSingle();
        setCounsellor(data as Record<string, unknown> | null);
      } else {
        const { data } = await supabase.from("students").select("*").eq("user_id", user.id).maybeSingle();
        setStudent(data as Record<string, unknown> | null);
      }
    })();
  }, [user, isCounsellor]);

  const profile = isCounsellor ? counsellor : student;
  const setField = (k: string, v: unknown) =>
    isCounsellor
      ? setCounsellor((p) => ({ ...(p ?? {}), [k]: v }))
      : setStudent((p) => ({ ...(p ?? {}), [k]: v }));

  async function save() {
    if (!user || !profile) return;
    setSaving(true);
    const table = isCounsellor ? "counsellors" : "students";
    const payload = { ...profile } as Record<string, unknown>;
    delete payload['id'];
    delete payload['user_id'];
    delete payload['created_at'];
    delete payload['updated_at'];
    delete payload['email'];
    const { error } = await supabase.from(table).update(payload as never).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile updated");
  }

  async function changePassword() {
    const { error } = await supabase.auth.resetPasswordForEmail(user?.email ?? "", {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Password reset link sent to your email");
  }

  const str = (k: string) => (profile?.[k] as string | null) ?? "";

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Settings</h1>
          <p className="text-sm text-muted-foreground">Your profile, privacy and permissions.</p>
        </div>

        <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-lg font-semibold">Profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Full name</Label>
              <Input value={str("full_name")} onChange={(e) => setField("full_name", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            {isCounsellor ? (
              <>
                <div className="space-y-2">
                  <Label>Specialization</Label>
                  <Input
                    value={str("specialization")}
                    onChange={(e) => setField("specialization", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Qualification</Label>
                  <Input
                    value={str("qualification")}
                    onChange={(e) => setField("qualification", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Hospital / clinic</Label>
                  <Input value={str("hospital")} onChange={(e) => setField("hospital", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={str("city")} onChange={(e) => setField("city", e.target.value)} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Bio</Label>
                  <Textarea value={str("bio")} onChange={(e) => setField("bio", e.target.value)} />
                </div>
                <div className="flex items-center justify-between rounded-xl border p-4 sm:col-span-2">
                  <div>
                    <p className="text-sm font-medium">Available for new students</p>
                    <p className="text-xs text-muted-foreground">
                      Turn this off when you can&apos;t take emergency escalations.
                    </p>
                  </div>
                  <Switch
                    checked={Boolean(profile?.['is_available'])}
                    onCheckedChange={(v) => setField("is_available", v)}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label>Mobile number</Label>
                  <Input
                    value={str("mobile_number")}
                    onChange={(e) => setField("mobile_number", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>College</Label>
                  <Input value={str("college")} onChange={(e) => setField("college", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Parent / guardian mobile</Label>
                  <Input
                    value={str("parent_mobile")}
                    onChange={(e) => setField("parent_mobile", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Close friend mobile</Label>
                  <Input
                    value={str("friend_mobile")}
                    onChange={(e) => setField("friend_mobile", e.target.value)}
                  />
                </div>
              </>
            )}
          </div>
          <Button className="mt-4" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </Card>

        {!isCounsellor && (
          <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
            <h2 className="font-display text-lg font-semibold">Permissions</h2>
            <div className="mt-3 space-y-2">
              {PERMS.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between rounded-xl border p-4">
                  <p className="text-sm font-medium">{label}</p>
                  <Switch
                    checked={Boolean(profile?.[key])}
                    onCheckedChange={(v) => setField(key, v)}
                  />
                </div>
              ))}
            </div>
          </Card>
        )}

        <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-lg font-semibold">Security</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your data is encrypted in transit and protected by row-level security — only you and a
            counsellor you book can see your records.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void changePassword()}>
              Send password reset link
            </Button>
            <Button
              variant="ghost"
              onClick={async () => {
                await supabase.auth.signOut();
                void navigate({ to: "/auth", search: { portal: "student" }, replace: true });
              }}
            >
              Sign out
            </Button>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}