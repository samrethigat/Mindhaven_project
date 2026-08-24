import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { deleteCounsellorAccount } from "@/lib/counsellor-account.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogOut, ShieldAlert } from "lucide-react";

export const Route = createFileRoute("/_authenticated/account-settings")({
  component: AccountSettings,
});

type Profile = Record<string, unknown> | null;

const TEXT_FIELDS: [string, string][] = [
  ["full_name", "Full name"],
  ["phone", "Phone number"],
  ["qualification", "Qualification"],
  ["specialization", "Specialization"],
  ["hospital", "Hospital / clinic"],
  ["languages", "Languages"],
  ["address", "Address"],
  ["city", "City"],
  ["district", "District"],
  ["available_days", "Available days"],
  ["available_slots", "Available time slots"],
];

function AccountSettings() {
  const { user, isCounsellor, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const runDelete = useServerFn(deleteCounsellorAccount);

  const [profile, setProfile] = useState<Profile>(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("counsellors")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(data as Profile);
    })();
  }, [user]);

  const set = (k: string, v: unknown) => setProfile((p) => ({ ...(p ?? {}), [k]: v }));
  const str = (k: string) => (profile?.[k] as string | null) ?? "";

  async function save() {
    if (!user || !profile) return;
    setSaving(true);
    const payload = { ...profile } as Record<string, unknown>;
    for (const k of ["id", "user_id", "created_at", "updated_at", "email", "verified", "is_deleted"])
      delete payload[k];
    const { error } = await supabase
      .from("counsellors")
      .update(payload as never)
      .eq("user_id", user.id);
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

  async function signOut() {
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", search: { portal: "counsellor" }, replace: true });
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const res = await runDelete({ data: { password, confirm, reason } });
      queryClient.clear();
      await supabase.auth.signOut();
      localStorage.removeItem("mh_theme");
      toast.success("Your counsellor account has been deleted successfully.");
      if (res.cancelled) toast.message(`${res.cancelled} upcoming appointment(s) were cancelled.`);
      void navigate({ to: "/auth", search: { portal: "counsellor" }, replace: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete the account.");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </AppShell>
    );
  }

  if (!isCounsellor) {
    return (
      <AppShell>
        <Card className="border-0 p-6 shadow-[var(--shadow-soft)]">
          <h1 className="font-display text-xl font-bold">Counsellors only</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This page is for counsellor accounts. Your settings live on the settings page.
          </p>
          <Button asChild className="mt-4">
            <Link to="/settings">Go to settings</Link>
          </Button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Account settings</h1>
          <p className="text-sm text-muted-foreground">
            Your professional profile, privacy, notifications and account controls.
          </p>
        </div>

        <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-lg font-semibold">Edit profile</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ""} disabled />
            </div>
            {TEXT_FIELDS.map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <Input value={str(key)} maxLength={200} onChange={(e) => set(key, e.target.value)} />
              </div>
            ))}
            <div className="space-y-2">
              <Label>Experience (years)</Label>
              <Input
                type="number"
                min={0}
                max={70}
                value={(profile?.["experience_years"] as number | null) ?? 0}
                onChange={(e) => set("experience_years", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Consultation fee (₹)</Label>
              <Input
                type="number"
                min={0}
                value={(profile?.["consultation_fee"] as number | null) ?? 0}
                onChange={(e) => set("consultation_fee", Number(e.target.value))}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>Bio</Label>
              <Textarea value={str("bio")} maxLength={1000} onChange={(e) => set("bio", e.target.value)} />
            </div>
          </div>
          <Button className="mt-4" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </Card>

        <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-lg font-semibold">Privacy & notifications</h2>
          <div className="mt-3 space-y-2">
            {(
              [
                ["is_available", "Available for new students"],
                ["profile_public", "Show my profile in the counsellor directory"],
                ["notify_email", "Email notifications"],
                ["notify_push", "In-app notifications"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-xl border p-4">
                <p className="text-sm font-medium">{label}</p>
                <Switch
                  checked={Boolean(profile?.[key])}
                  onCheckedChange={(v) => set(key, v)}
                />
              </div>
            ))}
          </div>
          <Button className="mt-4" variant="outline" disabled={saving} onClick={() => void save()}>
            Save preferences
          </Button>
        </Card>

        <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-lg font-semibold">Security</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => void changePassword()}>
              Change password
            </Button>
            <Button variant="ghost" onClick={() => void signOut()}>
              <LogOut className="size-4" /> Logout
            </Button>
          </div>
        </Card>

        <Card className="border-destructive/40 bg-destructive/5 p-5">
          <h2 className="font-display text-lg font-semibold text-destructive">Danger zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Deleting your account removes your profile, chats and files, cancels upcoming
            appointments and notifies affected students.
          </p>
          <Button variant="destructive" className="mt-4" onClick={() => setOpen(true)}>
            <ShieldAlert className="size-4" /> Delete my account
          </Button>
        </Card>
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => {
          if (deleting) return;
          setOpen(o);
          if (!o) {
            setPassword("");
            setConfirm("");
            setReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete your counsellor account? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Current password</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
            <div className="space-y-2">
              <Label>Reason (optional)</Label>
              <Input value={reason} maxLength={500} onChange={(e) => setReason(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </Label>
              <Input value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="DELETE" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleting || confirm !== "DELETE" || password.length < 1}
              onClick={() => void confirmDelete()}
            >
              {deleting ? "Deleting…" : "Delete permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}