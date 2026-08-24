import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Logo } from "@/components/Logo";
import { GraduationCap, Stethoscope } from "lucide-react";

const searchSchema = z.object({
  portal: z.enum(["student", "counsellor"]).catch("student"),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in — MindHaven student & counsellor portals" },
      {
        name: "description",
        content:
          "Log in or create your MindHaven account. Separate secure portals for students and counsellors with email verification and password reset.",
      },
      { property: "og:title", content: "Sign in — MindHaven" },
      { property: "og:description", content: "Student and counsellor portals for MindHaven." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

function AuthPage() {
  const { portal } = Route.useSearch();
  const navigate = useNavigate();
  const isCounsellor = portal === "counsellor";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const search = window.location.search;
    if (!search.includes("access_token") && !search.includes("refresh_token") && !search.includes("type")) return;

    const finishOAuth = async () => {
      const { data, error } = await supabase.auth.getSessionFromUrl();
      if (error) {
        toast.error(error.message);
        return;
      }
      if (data.session) {
        window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        void navigate({ to: "/dashboard" });
      }
    };

    void finishOAuth();
  }, [navigate]);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("mh_remember_email") : null;
    if (saved) setEmail(saved);
  }, []);

  const persistEmail = () => {
    if (typeof window === "undefined") return;
    if (remember) localStorage.setItem("mh_remember_email", email);
    else localStorage.removeItem("mh_remember_email");
  };

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0]!.message); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword(parsed.data);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    persistEmail();
    toast.success("Welcome back 💙");
    void navigate({ to: "/dashboard" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) { toast.error(parsed.error.issues[0]!.message); return; }
    if (fullName.trim().length < 2) { toast.error("Please enter your full name"); return; }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { full_name: fullName.trim(), role: portal },
      },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    persistEmail();
    if (data.session) {
      toast.success("Account created 🎉");
      void navigate({ to: "/dashboard" });
    } else {
      toast.success("Check your email to verify your account, then log in.");
    }
  }

  async function handleForgot() {
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) { toast.error("Enter your email first"); return; }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password reset link sent to your email");
  }

  async function sendOtp() {
    const parsed = z.string().email().safeParse(email.trim());
    if (!parsed.success) { toast.error("Enter a valid email"); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data,
      options: { shouldCreateUser: false },
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setOtpSent(true);
    toast.success("We sent a 6-digit code to your email");
  }

  async function verifyOtp() {
    if (otp.length !== 6) { toast.error("Enter the 6-digit code"); return; }
    setBusy(true);
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: otp, type: "email" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Verified 🎉");
    void navigate({ to: "/dashboard" });
  }

  async function handleGoogle() {
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth?portal=${portal}`,
      },
    });
    setBusy(false);

    if (error) {
      toast.error("Google sign-in failed. Try email instead.");
      return;
    }

    if (data?.url) {
      window.location.assign(data.url);
      return;
    }

    toast.error("Google sign-in did not start. Please try again.");
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-10"
      style={{ backgroundImage: "var(--gradient-hero)" }}
    >
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center">
          <Logo />
        </Link>

        <div className="glass mb-4 grid grid-cols-2 gap-1 rounded-2xl p-1">
          <Link
            to="/auth"
            search={{ portal: "student" }}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              !isCounsellor ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <GraduationCap className="size-4" /> Student
          </Link>
          <Link
            to="/auth"
            search={{ portal: "counsellor" }}
            className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
              isCounsellor ? "gradient-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Stethoscope className="size-4" /> Counsellor
          </Link>
        </div>

        <Card className="glass border-0 p-6">
          <h1 className="font-display text-xl font-bold">
            {isCounsellor ? "Counsellor portal" : "Student portal"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {isCounsellor
              ? "Support students with sessions, notes and emergency response."
              : "Your private space for mood, journaling and support."}
          </p>

          <Tabs defaultValue="login" className="mt-5">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="otp">OTP</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                    Remember me
                  </label>
                  <button type="button" onClick={handleForgot} className="text-sm text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Signing in…" : "Log in"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="space-y-4" onSubmit={handleSignup}>
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="semail">Email</Label>
                  <Input id="semail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spassword">Password</Label>
                  <Input
                    id="spassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Minimum 8 characters.</p>
                </div>
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy ? "Creating…" : `Create ${isCounsellor ? "counsellor" : "student"} account`}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="otp">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oemail">Email</Label>
                  <Input id="oemail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                {otpSent && (
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <InputOTPSlot key={i} index={i} />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                )}
                <Button
                  className="w-full"
                  disabled={busy}
                  onClick={otpSent ? verifyOtp : sendOtp}
                  type="button"
                >
                  {otpSent ? "Verify code" : "Send OTP"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <Button variant="outline" className="w-full" onClick={handleGoogle} type="button">
            Continue with Google
          </Button>
        </Card>
      </div>
    </div>
  );
}