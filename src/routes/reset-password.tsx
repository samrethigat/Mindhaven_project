import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Reset your password — MindHaven" },
      { name: "description", content: "Choose a new password for your MindHaven account." },
      { property: "og:title", content: "Reset your password — MindHaven" },
      { property: "og:description", content: "Choose a new password for your MindHaven account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (password !== confirm) { toast.error("Passwords do not match"); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    void navigate({ to: "/dashboard" });
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4"
      style={{ backgroundImage: "var(--gradient-hero)" }}
    >
      <Card className="glass w-full max-w-md border-0 p-6">
        <Logo />
        <h1 className="font-display mt-4 text-xl font-bold">Set a new password</h1>
        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="p1">New password</Label>
            <Input id="p1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p2">Confirm password</Label>
            <Input id="p2" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Updating…" : "Update password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}