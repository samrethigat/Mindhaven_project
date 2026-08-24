import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { RISK_LABEL } from "@/lib/assessment";
import { MoodPicker } from "@/components/MoodPicker";
import { CalendarHeart, LifeBuoy, MessageCircleHeart, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, isCounsellor, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isCounsellor) void navigate({ to: "/counsellor", replace: true });
  }, [loading, isCounsellor, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [student, assessment, moods, emotion, appointments, sleep] = await Promise.all([
        supabase.from("students").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase
          .from("assessments")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("mood_entries")
          .select("mood, mood_score, created_at")
          .order("created_at", { ascending: false })
          .limit(14),
        supabase
          .from("emotion_analyses")
          .select("emotion, risk, distress_score, created_at")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("appointments")
          .select("*")
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at")
          .limit(3),
        supabase.from("sleep_logs").select("hours, log_date").order("log_date", { ascending: false }).limit(7),
      ]);
      return {
        student: student.data,
        assessment: assessment.data,
        moods: moods.data ?? [],
        emotion: emotion.data,
        appointments: appointments.data ?? [],
        sleep: sleep.data ?? [],
      };
    },
  });

  useEffect(() => {
    if (!data) return;
    if (data.student && !data.student.onboarding_complete) void navigate({ to: "/onboarding" });
    else if (data.student && !data.assessment) void navigate({ to: "/assessment" });
  }, [data, navigate]);

  const firstName = data?.student?.full_name?.split(" ")[0] ?? "there";
  const wellbeing = data?.assessment?.wellbeing_score ?? 0;
  const risk = (data?.emotion?.risk ?? data?.assessment?.risk ?? "level_1") as keyof typeof RISK_LABEL;

  const chartData = (data?.moods ?? [])
    .slice()
    .reverse()
    .map((m) => ({
      day: new Date(m.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      mood: m.mood_score,
    }));

  const avgSleep =
    (data?.sleep?.length ?? 0) > 0
      ? (data!.sleep.reduce((s, r) => s + Number(r.hours), 0) / data!.sleep.length).toFixed(1)
      : "—";

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight md:text-3xl">
            Hey {firstName}, how are you really doing today?
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Everything here is private. Take one small step for yourself today.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-36 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass border-0 p-5">
              <p className="text-sm text-muted-foreground">Mental health score</p>
              <p className="font-display mt-2 text-4xl font-extrabold text-primary">{wellbeing}</p>
              <Progress value={wellbeing} className="mt-3" />
              <p className="mt-2 text-xs text-muted-foreground">
                From your latest psychological assessment.
              </p>
            </Card>

            <Card className="glass border-0 p-5">
              <p className="text-sm text-muted-foreground">Emotion status</p>
              <p className="font-display mt-2 text-2xl font-bold capitalize">
                {data?.emotion?.emotion ?? "unknown"}
              </p>
              <Badge
                className="mt-3"
                variant={risk === "level_3" ? "destructive" : risk === "level_2" ? "secondary" : "default"}
              >
                {RISK_LABEL[risk]}
              </Badge>
              <p className="mt-2 text-xs text-muted-foreground">
                Combined from chat, face, voice, typing and questionnaire.
              </p>
            </Card>

            <Card className="glass border-0 p-5">
              <p className="text-sm text-muted-foreground">Sleep (7-day average)</p>
              <p className="font-display mt-2 text-4xl font-extrabold">{avgSleep}<span className="text-lg"> h</span></p>
              <Button asChild variant="link" className="mt-2 h-auto p-0">
                <Link to="/wellbeing">Log tonight&apos;s sleep →</Link>
              </Button>
            </Card>
          </div>
        )}

        <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-lg font-semibold">Today&apos;s mood</h2>
          <p className="text-sm text-muted-foreground">One tap. That&apos;s the whole check-in.</p>
          <MoodPicker className="mt-4" />
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="border-0 p-5 shadow-[var(--shadow-soft)] lg:col-span-2">
            <h2 className="font-display text-lg font-semibold">Mood & stress trend</h2>
            {chartData.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Log a few moods and your trend line will appear here.
              </p>
            ) : (
              <div className="mt-4 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="moodFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="day" fontSize={12} stroke="var(--color-muted-foreground)" />
                    <YAxis domain={[0, 10]} fontSize={12} stroke="var(--color-muted-foreground)" />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="mood"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      fill="url(#moodFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
            <h2 className="font-display text-lg font-semibold">Upcoming</h2>
            {(data?.appointments.length ?? 0) === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">No appointments booked yet.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {data!.appointments.map((a) => (
                  <li key={a.id} className="rounded-xl bg-muted/60 p-3">
                    <p className="text-sm font-medium">
                      {new Date(a.scheduled_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {a.mode} · {a.status}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link to="/counsellors">Book a session</Link>
            </Button>
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction to="/companion" icon={MessageCircleHeart} label="Talk to Mira" />
          <QuickAction to="/journal" icon={Sparkles} label="Write in journal" />
          <QuickAction to="/appointments" icon={CalendarHeart} label="My appointments" />
          <QuickAction to="/emergency" icon={LifeBuoy} label="Emergency help" danger />
        </div>
      </div>
    </AppShell>
  );
}

function QuickAction({
  to,
  icon: Icon,
  label,
  danger,
}: {
  to: "/companion" | "/journal" | "/appointments" | "/emergency";
  icon: typeof MessageCircleHeart;
  label: string;
  danger?: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 rounded-2xl p-4 transition-transform hover:-translate-y-0.5 ${
        danger
          ? "bg-destructive text-destructive-foreground"
          : "glass text-foreground"
      }`}
    >
      <Icon className="size-5" />
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}