import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { BookAppointmentDialog, type BookTarget } from "@/components/BookAppointmentDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  CalendarPlus,
  CheckCheck,
  MessageSquare,
  Phone,
  UserRound,
  Video,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/emergency-cases")({
  head: () => ({
    meta: [
      { title: "Emergency management — MindHaven" },
      {
        name: "description",
        content: "Live view of students flagged as critical by the AI risk engine.",
      },
    ],
  }),
  component: EmergencyCases,
});

type Student = {
  user_id: string;
  full_name: string;
  age: number | null;
  gender: string | null;
  mobile_number: string | null;
  parent_name: string | null;
  parent_mobile: string | null;
  friend_name: string | null;
  friend_mobile: string | null;
  emergency_contact: string | null;
  email: string;
  department: string | null;
  year_of_study: string | null;
  college: string | null;
  city: string | null;
  blood_group: string | null;
  avatar_url: string | null;
  last_active_at: string | null;
};

function timeAgo(iso: string | null) {
  if (!iso) return "unknown";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function CallButton({ label, number }: { label: string; number: string | null }) {
  if (!number) {
    return (
      <Button size="sm" variant="outline" disabled>
        <Phone className="size-4" /> {label} — n/a
      </Button>
    );
  }
  return (
    <Button asChild size="sm" variant="outline">
      <a href={`tel:${number}`} title={number}>
        <Phone className="size-4" /> {label}
        <span className="hidden text-xs text-muted-foreground sm:inline">{number}</span>
      </a>
    </Button>
  );
}

function EmergencyCases() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [booking, setBooking] = useState<BookTarget | null>(null);
  const [profile, setProfile] = useState<Student | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["emergency-cases"],
    refetchInterval: 30000,
    queryFn: async () => {
      const { data: alerts } = await supabase
        .from("emergency_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(60);
      const ids = [...new Set((alerts ?? []).map((a) => a.student_user_id))];
      let students: Student[] = [];
      if (ids.length) {
        const { data: rows } = await supabase
          .from("students")
          .select(
            "user_id, full_name, age, gender, mobile_number, parent_name, parent_mobile, friend_name, friend_mobile, emergency_contact, email, department, year_of_study, college, city, blood_group, avatar_url, last_active_at",
          )
          .in("user_id", ids);
        students = (rows ?? []) as Student[];
      }
      return { alerts: alerts ?? [], students };
    },
  });

  async function resolve(id: string) {
    const { error } = await supabase
      .from("emergency_alerts")
      .update({ resolved: true, resolved_at: new Date().toISOString(), resolved_by: user?.id ?? null })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Case marked as resolved.");
    void queryClient.invalidateQueries({ queryKey: ["emergency-cases"] });
  }

  const alerts = data?.alerts ?? [];
  const active = alerts.filter((a) => !a.resolved);
  const resolved = alerts.filter((a) => a.resolved);

  function renderList(list: typeof alerts) {
    if (isLoading) return <p className="text-sm text-muted-foreground">Loading cases…</p>;
    if (list.length === 0)
      return (
        <Card className="glass border-0 p-8 text-center">
          <CheckCheck className="mx-auto size-8 text-primary" />
          <p className="mt-3 font-medium">No cases here right now.</p>
          <p className="text-sm text-muted-foreground">
            Students flagged as critical by the AI engine appear here instantly.
          </p>
        </Card>
      );

    return (
      <div className="grid gap-4 xl:grid-cols-2">
        {list.map((a) => {
          const s = data?.students.find((x) => x.user_id === a.student_user_id);
          const name = s?.full_name ?? "Student";
          const score = a.ai_score ?? 0;
          return (
            <Card
              key={a.id}
              className={`border-0 p-5 shadow-[var(--shadow-soft)] ${
                a.resolved ? "" : "ring-2 ring-destructive/50"
              }`}
            >
              <div className="flex items-start gap-4">
                <Avatar className="size-14">
                  {s?.avatar_url && <AvatarImage src={s.avatar_url} alt={name} />}
                  <AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-display text-lg font-semibold">{name}</p>
                    {a.resolved ? (
                      <Badge variant="secondary">Resolved</Badge>
                    ) : (
                      <Badge variant="destructive" className="animate-pulse">
                        <AlertTriangle className="size-3.5" /> Emergency
                      </Badge>
                    )}
                    <Badge variant="outline">AI risk {score}/100</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[s?.age ? `${s.age} yrs` : null, s?.gender, s?.department, s?.year_of_study]
                      .filter(Boolean)
                      .join(" · ") || "Profile incomplete"}
                  </p>
                  <p className="text-xs text-muted-foreground">{s?.email}</p>
                </div>
              </div>

              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-muted-foreground">Reason for emergency</dt>
                  <dd className="font-medium">{a.reason ?? a.summary}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Current mental status</dt>
                  <dd className="font-medium">{a.mental_status ?? "Severe distress"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Detected</dt>
                  <dd>{new Date(a.created_at).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Last active</dt>
                  <dd>{timeAgo(s?.last_active_at ?? null)}</dd>
                </div>
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <CallButton label="Patient" number={s?.mobile_number ?? null} />
                <CallButton label="Parent" number={s?.parent_mobile ?? null} />
                <CallButton label="Best friend" number={s?.friend_mobile ?? null} />
                <Button asChild size="sm" variant="outline">
                  <Link to="/chat/$peerId" params={{ peerId: a.student_user_id }}>
                    <MessageSquare className="size-4" /> Chat
                  </Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/call/$roomId" params={{ roomId: a.id }}>
                    <Video className="size-4" /> Start video call
                  </Link>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setBooking({
                      studentUserId: a.student_user_id,
                      counsellorUserId: user?.id ?? "",
                      name,
                    })
                  }
                >
                  <CalendarPlus className="size-4" /> Book appointment
                </Button>
                <Button size="sm" variant="ghost" onClick={() => s && setProfile(s)}>
                  <UserRound className="size-4" /> View full profile
                </Button>
                {!a.resolved && (
                  <Button size="sm" variant="secondary" onClick={() => void resolve(a.id)}>
                    <CheckCheck className="size-4" /> Mark as resolved
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display flex items-center gap-2 text-2xl font-bold">
            🚨 Emergency management
          </h1>
          <p className="text-sm text-muted-foreground">
            Students the AI engine flagged as critical — high depression, high anxiety, suicide or
            self-harm risk, or an emotional breakdown.
          </p>
        </div>

        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active ({active.length})</TabsTrigger>
            <TabsTrigger value="resolved">Resolved ({resolved.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="active" className="mt-4">
            {renderList(active)}
          </TabsContent>
          <TabsContent value="resolved" className="mt-4">
            {renderList(resolved)}
          </TabsContent>
        </Tabs>
      </div>

      <BookAppointmentDialog target={booking} onOpenChange={(o) => !o && setBooking(null)} />

      <Dialog open={!!profile} onOpenChange={(o) => !o && setProfile(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{profile?.full_name}</DialogTitle>
          </DialogHeader>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {(
              [
                ["Age", profile?.age],
                ["Gender", profile?.gender],
                ["Email", profile?.email],
                ["Phone", profile?.mobile_number],
                ["Parent", `${profile?.parent_name ?? "—"} ${profile?.parent_mobile ?? ""}`],
                ["Best friend", `${profile?.friend_name ?? "—"} ${profile?.friend_mobile ?? ""}`],
                ["Emergency contact", profile?.emergency_contact],
                ["College", profile?.college],
                ["Department", profile?.department],
                ["Year", profile?.year_of_study],
                ["City", profile?.city],
                ["Blood group", profile?.blood_group],
                ["Last active", timeAgo(profile?.last_active_at ?? null)],
              ] as const
            ).map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="font-medium">{value || "—"}</dd>
              </div>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
