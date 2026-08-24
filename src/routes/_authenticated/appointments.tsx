import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { updateAppointment, requestReschedule } from "@/lib/appointments.functions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CalendarClock, MessageSquare, Video } from "lucide-react";

export const Route = createFileRoute("/_authenticated/appointments")({
  head: () => ({
    meta: [
      { title: "My appointments — MindHaven" },
      { name: "description", content: "Track, join, reschedule and manage counselling sessions." },
    ],
  }),
  component: Appointments,
});

type Appt = {
  id: string;
  student_user_id: string;
  counsellor_user_id: string;
  scheduled_at: string;
  mode: string;
  status: string;
  reason: string | null;
  purpose: string | null;
  notes: string | null;
  room_id: string;
  is_emergency: boolean;
  reschedule_requested_at: string | null;
  reschedule_note: string | null;
};

const TABS = ["pending", "confirmed", "completed", "cancelled"] as const;

function bucket(status: string) {
  if (status === "accepted") return "confirmed";
  if (status === "rejected") return "cancelled";
  return status;
}

function Appointments() {
  const { isCounsellor, user } = useAuth();
  const queryClient = useQueryClient();
  const setStatusFn = useServerFn(updateAppointment);
  const askReschedule = useServerFn(requestReschedule);
  const [reschedule, setReschedule] = useState<Appt | null>(null);
  const [note, setNote] = useState("");
  const [newWhen, setNewWhen] = useState("");

  const { data } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*")
        .order("scheduled_at", { ascending: true });
      return (data ?? []) as Appt[];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("appointments-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, () => {
        void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const { data: peers } = useQuery({
    queryKey: ["appointment-peers", isCounsellor],
    enabled: !!data?.length,
    queryFn: async () => {
      const ids = [
        ...new Set(
          (data ?? []).map((a) => (isCounsellor ? a.student_user_id : a.counsellor_user_id)),
        ),
      ];
      const map = new Map<string, { name: string; photo: string | null }>();
      if (!ids.length) return map;
      const [{ data: cs }, { data: ss }] = await Promise.all([
        supabase.from("counsellors").select("user_id, full_name, photo_url").in("user_id", ids),
        supabase.from("students").select("user_id, full_name, avatar_url").in("user_id", ids),
      ]);
      for (const r of cs ?? []) map.set(r.user_id, { name: r.full_name, photo: r.photo_url });
      for (const r of ss ?? []) map.set(r.user_id, { name: r.full_name, photo: r.avatar_url });
      return map;
    },
  });

  async function setStatus(
    id: string,
    status: "accepted" | "rejected" | "cancelled" | "completed",
    scheduledAt?: string,
  ) {
    try {
      await setStatusFn({ data: { id, status, ...(scheduledAt ? { scheduledAt } : {}) } });
      toast.success(`Appointment ${status}.`);
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    }
  }

  async function submitReschedule() {
    if (!reschedule) return;
    try {
      if (isCounsellor && newWhen) {
        await setStatusFn({ data: { id: reschedule.id, status: "accepted", scheduledAt: newWhen } });
        toast.success("Session moved.");
      } else {
        await askReschedule({ data: { id: reschedule.id, note } });
        toast.success("Reschedule request sent.");
      }
      setReschedule(null);
      setNote("");
      setNewWhen("");
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Request failed.");
    }
  }

  function card(a: Appt) {
    const peerId = isCounsellor ? a.student_user_id : a.counsellor_user_id;
    const peer = peers?.get(peerId);
    const upcoming = new Date(a.scheduled_at).getTime() > Date.now();
    return (
      <Card key={a.id} className="border-0 p-5 shadow-[var(--shadow-soft)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <Avatar className="size-11">
              <AvatarImage src={peer?.photo ?? undefined} alt={peer?.name ?? "Profile photo"} />
              <AvatarFallback>{(peer?.name ?? "?").slice(0, 1)}</AvatarFallback>
            </Avatar>
            <div>
            <p className="font-medium">{new Date(a.scheduled_at).toLocaleString()}</p>
            <p className="text-sm text-muted-foreground">
              {peer?.name ?? (isCounsellor ? "Student" : "Counsellor")}
            </p>
            <p className="text-xs text-muted-foreground capitalize">
              {a.mode === "in_person" ? "Offline · in person" : `Online · ${a.mode}`}
              {a.purpose || a.reason ? ` · ${a.purpose ?? a.reason}` : ""}
            </p>
            {a.reschedule_requested_at && (
              <p className="mt-1 text-xs text-primary">
                Reschedule requested: {a.reschedule_note}
              </p>
            )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {a.is_emergency && <Badge variant="destructive">Emergency</Badge>}
            <Badge variant={a.status === "accepted" ? "default" : "secondary"} className="capitalize">
              {a.status === "accepted" ? "confirmed" : a.status}
            </Badge>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {(a.mode === "video" || a.mode === "voice") && a.status === "accepted" && (
              <Button asChild size="sm">
                <Link to="/call/$roomId" params={{ roomId: a.room_id }}>
                  <Video className="size-4" /> Join meeting
                </Link>
              </Button>
            )}
          <Button asChild size="sm" variant="outline">
            <Link to="/chat/$peerId" params={{ peerId }}>
              <MessageSquare className="size-4" /> Chat
            </Link>
          </Button>
          {isCounsellor && a.status === "pending" && (
            <>
              <Button size="sm" variant="outline" onClick={() => void setStatus(a.id, "accepted")}>
                Approve
              </Button>
              <Button size="sm" variant="ghost" onClick={() => void setStatus(a.id, "rejected")}>
                Reject
              </Button>
            </>
          )}
          {isCounsellor && a.status === "accepted" && (
            <Button size="sm" variant="outline" onClick={() => void setStatus(a.id, "completed")}>
              Mark completed
            </Button>
          )}
          {a.status !== "cancelled" && a.status !== "completed" && a.status !== "rejected" && upcoming && (
            <>
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
              <Button size="sm" variant="ghost" onClick={() => void setStatus(a.id, "cancelled")}>
                Cancel
              </Button>
            </>
          )}
        </div>
        {isCounsellor && a.notes && (
          <p className="mt-3 rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground">{a.notes}</p>
        )}
      </Card>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">
            {isCounsellor ? "Appointments" : "My appointments"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isCounsellor
              ? "Approve, reschedule or complete sessions with your students."
              : "Your upcoming and past sessions, all in one place."}
          </p>
        </div>

        <Tabs defaultValue="pending">
          <TabsList>
            {TABS.map((t) => (
              <TabsTrigger key={t} value={t} className="capitalize">
                {t} ({(data ?? []).filter((a) => bucket(a.status) === t).length})
              </TabsTrigger>
            ))}
          </TabsList>
          {TABS.map((t) => {
            const list = (data ?? []).filter((a) => bucket(a.status) === t);
            return (
              <TabsContent key={t} value={t} className="mt-4 space-y-3">
                {list.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nothing here yet.</p>
                ) : (
                  list.map(card)
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      </div>

      <Dialog open={!!reschedule} onOpenChange={(o) => !o && setReschedule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isCounsellor ? "Reschedule session" : "Request a new time"}</DialogTitle>
          </DialogHeader>
          {isCounsellor ? (
            <div className="space-y-2">
              <Label htmlFor="new-when">New date & time</Label>
              <Input
                id="new-when"
                type="datetime-local"
                value={newWhen}
                onChange={(e) => setNewWhen(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="resched-note">When would suit you better?</Label>
              <Input
                id="resched-note"
                maxLength={300}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. any evening after 6pm"
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setReschedule(null)}>
              Cancel
            </Button>
            <Button onClick={() => void submitReschedule()} disabled={!user}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
