import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { updateAppointment } from "@/lib/appointments.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarClock, Check, MessageSquare, X } from "lucide-react";

export const Route = createFileRoute("/_authenticated/appointment-requests")({
  head: () => ({
    meta: [
      { title: "Appointment requests — MindHaven" },
      {
        name: "description",
        content: "Review, accept, reject or reschedule student appointment requests.",
      },
      { property: "og:title", content: "Appointment requests — MindHaven" },
      {
        property: "og:description",
        content: "Review, accept, reject or reschedule student appointment requests.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AppointmentRequests,
});

type Appt = {
  id: string;
  student_user_id: string;
  scheduled_at: string;
  mode: string;
  status: string;
  reason: string | null;
  purpose: string | null;
  notes: string | null;
  reschedule_requested_at: string | null;
  reschedule_note: string | null;
};

function AppointmentRequests() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const setStatusFn = useServerFn(updateAppointment);
  const [reschedule, setReschedule] = useState<Appt | null>(null);
  const [newWhen, setNewWhen] = useState("");

  const { data } = useQuery({
    queryKey: ["appointment-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .eq("status", "pending")
        .order("scheduled_at", { ascending: true });
      return (data ?? []) as Appt[];
    },
  });

  const { data: students } = useQuery({
    queryKey: ["request-students", (data ?? []).map((a) => a.student_user_id).join(",")],
    enabled: !!data?.length,
    queryFn: async () => {
      const ids = [...new Set((data ?? []).map((a) => a.student_user_id))];
      const { data: rows } = await supabase
        .from("students")
        .select("user_id, full_name, avatar_url, department, year_of_study")
        .in("user_id", ids);
      return new Map((rows ?? []).map((r) => [r.user_id, r]));
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("appointment-requests-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["appointment-requests"] });
        void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  async function act(id: string, status: "accepted" | "rejected", scheduledAt?: string) {
    try {
      await setStatusFn({ data: { id, status, ...(scheduledAt ? { scheduledAt } : {}) } });
      toast.success(status === "accepted" ? "Appointment confirmed." : "Appointment rejected.");
      void queryClient.invalidateQueries({ queryKey: ["appointment-requests"] });
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">📅 Appointment requests</h1>
          <p className="text-sm text-muted-foreground">
            New session requests from students. They update live as they come in.
          </p>
        </div>

        {(data ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending requests right now.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {(data ?? []).map((a) => {
              const s = students?.get(a.student_user_id);
              return (
                <Card key={a.id} className="border-0 p-5 shadow-[var(--shadow-soft)]">
                  <div className="flex items-start gap-3">
                    <Avatar className="size-12">
                      <AvatarImage src={s?.avatar_url ?? undefined} alt={s?.full_name ?? "Student"} />
                      <AvatarFallback>{(s?.full_name ?? "S").slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-semibold">{s?.full_name ?? "Student"}</p>
                      <p className="text-xs text-muted-foreground">
                        {[s?.department, s?.year_of_study].filter(Boolean).join(" · ")}
                      </p>
                      <p className="mt-2 text-sm">{new Date(a.scheduled_at).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">
                        {a.mode === "in_person" ? "Offline · in person" : "Online · video"}
                      </p>
                      {(a.purpose || a.reason) && (
                        <p className="mt-2 text-sm">Reason: {a.purpose ?? a.reason}</p>
                      )}
                      {a.notes && (
                        <p className="mt-2 rounded-lg bg-muted/60 p-2 text-xs text-muted-foreground">
                          {a.notes}
                        </p>
                      )}
                      {a.reschedule_requested_at && (
                        <p className="mt-2 text-xs text-primary">
                          Reschedule requested: {a.reschedule_note}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {a.status}
                    </Badge>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" onClick={() => void act(a.id, "accepted")}>
                      <Check className="size-4" /> Accept
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => void act(a.id, "rejected")}>
                      <X className="size-4" /> Reject
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setReschedule(a);
                        setNewWhen(a.scheduled_at.slice(0, 16));
                      }}
                    >
                      <CalendarClock className="size-4" /> Reschedule
                    </Button>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/chat/$peerId" params={{ peerId: a.student_user_id }}>
                        <MessageSquare className="size-4" /> Chat
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!reschedule} onOpenChange={(o) => !o && setReschedule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule &amp; confirm</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="req-when">New date &amp; time</Label>
            <Input
              id="req-when"
              type="datetime-local"
              value={newWhen}
              onChange={(e) => setNewWhen(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReschedule(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!reschedule || !newWhen) return;
                void act(reschedule.id, "accepted", newWhen);
                setReschedule(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}