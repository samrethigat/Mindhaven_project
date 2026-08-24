import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: Onboarding,
});

type Form = {
  full_name: string;
  mobile_number: string;
  dob: string;
  age: string;
  gender: string;
  blood_group: string;
  register_number: string;
  college: string;
  department: string;
  year_of_study: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pin_code: string;
  parent_name: string;
  parent_mobile: string;
  friend_name: string;
  friend_mobile: string;
  emergency_contact: string;
};

const EMPTY: Form = {
  full_name: "",
  mobile_number: "",
  dob: "",
  age: "",
  gender: "",
  blood_group: "",
  register_number: "",
  college: "",
  department: "",
  year_of_study: "",
  address: "",
  city: "",
  state: "",
  country: "India",
  pin_code: "",
  parent_name: "",
  parent_mobile: "",
  friend_name: "",
  friend_mobile: "",
  emergency_contact: "",
};

const phone = z.string().regex(/^[0-9+\-\s()]{7,15}$/, "Enter a valid phone number");

const STEP_TITLES = ["About you", "College details", "Trusted contacts", "Permissions"];

function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [perms, setPerms] = useState({
    perm_location: false,
    perm_camera: false,
    perm_microphone: false,
    perm_notification: false,
    perm_storage: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;
      const { data } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", auth.user.id)
        .maybeSingle();
      if (!data) return;
      setForm((f) => ({
        ...f,
        full_name: data.full_name ?? "",
        mobile_number: data.mobile_number ?? "",
        dob: data.dob ?? "",
        age: data.age ? String(data.age) : "",
        gender: data.gender ?? "",
        blood_group: data.blood_group ?? "",
        register_number: data.register_number ?? "",
        college: data.college ?? "",
        department: data.department ?? "",
        year_of_study: data.year_of_study ?? "",
        address: data.address ?? "",
        city: data.city ?? "",
        state: data.state ?? "",
        country: data.country ?? "India",
        pin_code: data.pin_code ?? "",
        parent_name: data.parent_name ?? "",
        parent_mobile: data.parent_mobile ?? "",
        friend_name: data.friend_name ?? "",
        friend_mobile: data.friend_mobile ?? "",
        emergency_contact: data.emergency_contact ?? "",
      }));
    })();
  }, []);

  const set = (k: keyof Form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  function validateStep(): boolean {
    if (step === 0) {
      if (form.full_name.trim().length < 2) {
        toast.error("Please enter your full name");
        return false;
      }
      if (!phone.safeParse(form.mobile_number).success) {
        toast.error("Enter a valid mobile number");
        return false;
      }
    }
    if (step === 1 && form.college.trim().length < 2) {
      toast.error("Please enter your college name");
      return false;
    }
    if (step === 2) {
      if (!phone.safeParse(form.parent_mobile).success) {
        toast.error("A parent/guardian number is required for your safety");
        return false;
      }
      if (form.friend_mobile && !phone.safeParse(form.friend_mobile).success) {
        toast.error("Enter a valid friend number");
        return false;
      }
    }
    return true;
  }

  async function requestPermission(key: keyof typeof perms, value: boolean) {
    if (!value) {
      setPerms((p) => ({ ...p, [key]: false }));
      return;
    }
    try {
      if (key === "perm_location") {
        await new Promise<void>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const { data: auth } = await supabase.auth.getUser();
              if (auth.user) {
                await supabase
                  .from("students")
                  .update({ last_lat: pos.coords.latitude, last_lng: pos.coords.longitude })
                  .eq("user_id", auth.user.id);
              }
              resolve();
            },
            (e) => reject(e),
          ),
        );
      }
      if (key === "perm_camera" || key === "perm_microphone") {
        const stream = await navigator.mediaDevices.getUserMedia(
          key === "perm_camera" ? { video: true } : { audio: true },
        );
        stream.getTracks().forEach((t) => t.stop());
      }
      if (key === "perm_notification") {
        const res = await Notification.requestPermission();
        if (res !== "granted") throw new Error("denied");
      }
      setPerms((p) => ({ ...p, [key]: true }));
    } catch {
      toast.error("Permission denied by your browser. You can enable it later in Settings.");
      setPerms((p) => ({ ...p, [key]: false }));
    }
  }

  async function finish() {
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase
      .from("students")
      .update({
        ...form,
        age: form.age ? Number(form.age) : null,
        dob: form.dob || null,
        ...perms,
        onboarding_complete: true,
      })
      .eq("user_id", auth.user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Profile saved. Let's do your wellbeing check.");
    void navigate({ to: "/assessment" });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Let&apos;s set up your safe space</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Step {step + 1} of 4 · {STEP_TITLES[step]}
          </p>
          <Progress value={((step + 1) / 4) * 100} className="mt-3" />
        </div>

        <Card className="border-0 p-6 shadow-[var(--shadow-soft)]">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Full name" value={form.full_name} onChange={set("full_name")} />
              <Field label="Mobile number" value={form.mobile_number} onChange={set("mobile_number")} />
              <Field label="Date of birth" type="date" value={form.dob} onChange={set("dob")} />
              <Field label="Age" type="number" value={form.age} onChange={set("age")} />
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={form.gender} onValueChange={set("gender")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Female", "Male", "Non-binary", "Prefer not to say"].map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Blood group" value={form.blood_group} onChange={set("blood_group")} />
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="College / University" value={form.college} onChange={set("college")} />
              <Field label="Register number" value={form.register_number} onChange={set("register_number")} />
              <Field label="Department" value={form.department} onChange={set("department")} />
              <div className="space-y-2">
                <Label>Year of study</Label>
                <Select value={form.year_of_study} onValueChange={set("year_of_study")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {["1st year", "2nd year", "3rd year", "4th year", "5th year", "Postgraduate"].map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Field label="Address" value={form.address} onChange={set("address")} />
              <Field label="City" value={form.city} onChange={set("city")} />
              <Field label="State" value={form.state} onChange={set("state")} />
              <Field label="Country" value={form.country} onChange={set("country")} />
              <Field label="PIN code" value={form.pin_code} onChange={set("pin_code")} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                We only contact these people if you are in danger, or if you ask us to.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Parent / guardian name" value={form.parent_name} onChange={set("parent_name")} />
                <Field label="Parent / guardian mobile" value={form.parent_mobile} onChange={set("parent_mobile")} />
                <Field label="Close friend name" value={form.friend_name} onChange={set("friend_name")} />
                <Field label="Close friend mobile" value={form.friend_mobile} onChange={set("friend_mobile")} />
                <Field
                  label="Other emergency contact"
                  value={form.emergency_contact}
                  onChange={set("emergency_contact")}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3">
              <p className="rounded-xl bg-muted/60 p-3 text-sm text-muted-foreground">
                These are optional, but they let MindHaven reach you fast when it matters.
              </p>
              {(
                [
                  ["perm_location", "Location", "Find the nearest counsellor and send help in an emergency"],
                  ["perm_camera", "Camera", "Optional facial emotion check-ins and video sessions"],
                  ["perm_microphone", "Microphone", "Voice notes and voice calls with your counsellor"],
                  ["perm_notification", "Notifications", "Gentle reminders and appointment alerts"],
                  ["perm_storage", "Files", "Attach reports or images to your journal"],
                ] as const
              ).map(([key, label, desc]) => (
                <div key={key} className="flex items-start justify-between gap-4 rounded-xl border p-4">
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  <Switch
                    checked={perms[key]}
                    onCheckedChange={(v) => {
                      if (key === "perm_storage") setPerms((p) => ({ ...p, perm_storage: v }));
                      else void requestPermission(key, v);
                    }}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 flex justify-between gap-3">
            <Button variant="ghost" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
              Back
            </Button>
            {step < 3 ? (
              <Button
                onClick={() => {
                  if (validateStep()) setStep((s) => s + 1);
                }}
              >
                Continue
              </Button>
            ) : (
              <Button disabled={saving} onClick={() => void finish()}>
                {saving ? "Saving..." : "Finish setup"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}