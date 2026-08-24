import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
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

export type BookTarget = { studentUserId: string; counsellorUserId: string; name: string };

export function BookAppointmentDialog({
  target,
  onOpenChange,
}: {
  target: BookTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const book = useServerFn(createAppointment);
  const queryClient = useQueryClient();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [meeting, setMeeting] = useState("online");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!target) return;
    if (!date || !time) {
      toast.error("Please choose a date and a time.");
      return;
    }
    setSaving(true);
    try {
      await book({
        data: {
          counsellorUserId: target.counsellorUserId,
          studentUserId: target.studentUserId,
          scheduledAt: `${date}T${time}`,
          mode: meeting === "online" ? "video" : "in_person",
          purpose,
          notes,
        },
      });
      toast.success(`Appointment booked with ${target.name}.`);
      void queryClient.invalidateQueries({ queryKey: ["appointments"] });
      void queryClient.invalidateQueries({ queryKey: ["counsellor-home"] });
      setPurpose("");
      setNotes("");
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not book the appointment.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={!!target} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book appointment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Patient name</Label>
            <Input value={target?.name ?? ""} readOnly className="bg-muted/50" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="appt-date">Date</Label>
              <Input id="appt-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appt-time">Time</Label>
              <Input id="appt-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Meeting type</Label>
            <Select value={meeting} onValueChange={setMeeting}>
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
            <Label htmlFor="appt-purpose">Purpose</Label>
            <Input
              id="appt-purpose"
              maxLength={200}
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              placeholder="Crisis follow-up, therapy session…"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="appt-notes">Notes</Label>
            <Textarea
              id="appt-notes"
              maxLength={2000}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Private notes for this session"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={() => void save()}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
