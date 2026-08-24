import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarCheck,
  CalendarClock,
  CheckCircle2,
  MessagesSquare,
  Sun,
  XCircle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/counsellor")({
  component: CounsellorHome,
});

function StatCard({
  label,
  value,
  icon: Icon,
  to,
}: {
  label: string;
  value: number;
  icon: typeof Sun;
  to: string;
}) {
  return (
    <Link to={to}>
      <Card className="glass h-full border-0 p-4 transition-transform hover:-translate-y-0.5">
        <div className="flex items-center gap-3">
          <span className="gradient-primary flex size-9 items-center justify-center rounded-xl text-primary-foreground">
            <Icon className="size-4" />
          </span>
          <div>
            <p className="font-display text-2xl font-bold leading-none">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}

function CounsellorHome() {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["counsellor-profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("counsellors")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["counsellor-home"],
    queryFn: async () => {
      const [appointments, alerts, messages] = await Promise.all([
        supabase.from("appointments").select("*").order("scheduled_at").limit(200),
        supabase
          .from("emergency_alerts")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase.from("messages").select("id, read_at, recipient_id").is("read_at", null),
      ]);
      return {
        appointments: appointments.data ?? [],
        alerts: alerts.data ?? [],
        unread: (messages.data ?? []).length,
      };
    },
  });

  const appts = data?.appointments ?? [];
  const now = new Date();
  const isToday = (d: string) => new Date(d).toDateString() === now.toDateString();
  const stats = {
    today: appts.filter((a) => isToday(a.scheduled_at) && a.status === "accepted").length,
    upcoming: appts.filter((a) => new Date(a.scheduled_at) > now && a.status === "accepted").length,
    pending: appts.filter((a) => a.status === "pending").length,
    completed: appts.filter((a) => a.status === "completed").length,
    cancelled: appts.filter((a) => a.status === "cancelled" || a.status === "rejected").length,
  };

  const fields: [string, unknown][] = [
    ["Counsellor ID", profile?.id?.slice(0, 8).toUpperCase()],
    ["Qualification", profile?.qualification],
    ["Specialization", profile?.specialization],
    ["Experience", profile?.experience_years ? `${profile.experience_years} years` : null],
    ["Hospital / clinic", profile?.hospital ?? profile?.clinic],
    ["Email", profile?.email],
    ["Phone", profile?.phone],
    ["Languages", profile?.languages],
    ["Address", profile?.address],
    ["City", profile?.city],
    ["District", profile?.district],
    ["Available days", profile?.available_days],
    ["Available slots", profile?.available_slots ?? profile?.availability],
    ["Consultation fee", profile?.consultation_fee ? `₹${profile.consultation_fee}` : null],
    ["Rating", profile?.rating ? `${profile.rating} / 5` : "New"],
    [
      "Total patients",
      new Set(appts.map((a) => a.student_user_id)).size,
    ],
    [
      "Member since",
      profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : null,
    ],
  ];
  const filled = fields.filter(([, v]) => v != null && v !== "").length;
  const completion = Math.round((filled / fields.length) * 100);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-bold">Your practice</h1>
            <p className="text-sm text-muted-foreground">
              Students who booked with you, and emergency escalations assigned to you.
            </p>
          </div>
          {stats.pending > 0 && (
            <Link to="/appointment-requests">
              <Badge className="animate-pulse px-3 py-1.5 text-sm">
                🔔 You have {stats.pending} new appointment request
                {stats.pending > 1 ? "s" : ""}
              </Badge>
            </Link>
          )}
        </div>

        <Card className="glass border-0 p-5">
          <div className="flex flex-wrap items-start gap-4">
            <Avatar className="size-16">
              <AvatarImage src={profile?.photo_url ?? undefined} alt={profile?.full_name ?? ""} />
              <AvatarFallback>{(profile?.full_name ?? "C").slice(0, 2)}</AvatarFallback>
            </Avatar>
            <div className="min-w-56 flex-1">
              <p className="font-display text-xl font-bold">{profile?.full_name ?? "Counsellor"}</p>
              <p className="text-sm text-muted-foreground">
                {profile?.specialization ?? "Counselling psychologist"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant={profile?.is_available ? "default" : "secondary"}>
                  {profile?.is_available ? "Online" : "Offline"}
                </Badge>
                {profile?.verified && <Badge variant="outline">Verified</Badge>}
                <Badge variant="outline">Profile {completion}% complete</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="outline">
                <Link to="/account-settings">Edit profile</Link>
              </Button>
            </div>
          </div>
          <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fields.map(([label, value]) => (
              <div key={label} className="rounded-xl border p-3">
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="text-sm font-medium">{(value as string) || "—"}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {isLoading ? (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Today" value={stats.today} icon={Sun} to="/appointments" />
            <StatCard label="Upcoming" value={stats.upcoming} icon={CalendarClock} to="/appointments" />
            <StatCard
              label="Pending requests"
              value={stats.pending}
              icon={CalendarCheck}
              to="/appointment-requests"
            />
            <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} to="/appointments" />
            <StatCard label="Cancelled" value={stats.cancelled} icon={XCircle} to="/appointments" />
            <StatCard
              label="Unread chats"
              value={data?.unread ?? 0}
              icon={MessagesSquare}
              to="/messages"
            />
          </div>
        )}

        <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-lg font-semibold">Emergency escalations</h2>
          {(data?.alerts.length ?? 0) === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No active alerts.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {data!.alerts.map((a) => (
                <li key={a.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium">{a.summary}</p>
                    <Badge variant={a.resolved ? "secondary" : "destructive"}>
                      {a.resolved ? "Resolved" : "Active"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(a.created_at).toLocaleString()} · source: {a.trigger_source}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-lg font-semibold">Sessions</h2>
          {appts.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No sessions booked yet.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {appts.slice(0, 20).map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                  <span className="text-sm">
                    {new Date(a.scheduled_at).toLocaleString()}
                    <span className="block text-xs text-muted-foreground capitalize">{a.mode}</span>
                  </span>
                  <Badge className="capitalize">{a.status}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}