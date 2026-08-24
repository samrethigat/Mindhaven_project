import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { createAppointment } from "@/lib/appointments.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type BookingCounsellor = { user_id: string; full_name: string };

const SLOTS = Array.from({ length: 20 }, (_, i) => {
  const mins = 9 * 60 + i * 30;
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
});

export function AppointmentBookingDialog({
  counsellor,
  onOpenChange,
  onBooked,
}: {
  counsellor: BookingCounsellor | null;
  onOpenChange: (open: boolean) => void;
  onBooked?: () => void;
}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const book = useServerFn(createAppointment);
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [type, setType] = useState("online");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: me } = useQuery({
    queryKey: ["my-student-name", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("students")
        .select("full_name")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data?.full_name ?? user?.email ?? "";
    },
  });

  async function confirm() {
    if (!counsellor) return;
    if (!date || !slot) {
      toast.error("Please pick a date and a time slot.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please add a reason for the appointment.");
      return;
    }
    setSaving(true);
    try {
      await book({
        data: {
          counsellorUserId: counsellor.user_id,
          studentUserId: user!.id,
          scheduledAt: `${date}T${slot}`,
          mode: type === "online" ? "video" : "in_person",
          purpose: reason.trim(),
          notes: notes.trim(),
        },
      });
      toast.success(`Appointment request sent to ${counsellor.full_name}.`);
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      setDate("");
      setSlot("");
      setReason("");
      setNotes("");
      onOpenChange(false);
      onBooked?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not book the appointment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!counsellor} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>📅 Book appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Counsellor</Label>
              <Input readOnly className="bg-muted/50" value={counsellor?.full_name ?? ""} />
            </div>
            <div className="space-y-2">
              <Label>Your name</Label>
              <Input readOnly className="bg-muted/50" value={me ?? ""} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="book-date">Date</Label>
              <Input
                id="book-date"
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Time slot</Label>
              <Select value={slot} onValueChange={setSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a slot" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {SLOTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Consultation type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online (video)</SelectItem>
                <SelectItem value="offline">Offline (in person)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="book-reason">Reason for appointment</Label>
            <Input
              id="book-reason"
              maxLength={200}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Exam stress, anxiety, sleep trouble…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="book-notes">Additional notes (optional)</Label>
            <Textarea
              id="book-notes"
              maxLength={2000}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything the counsellor should know beforehand"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={() => void confirm()}>
            {saving ? "Confirming…" : "Confirm appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}