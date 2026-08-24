import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { MoodPicker } from "@/components/MoodPicker";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/wellbeing")({
  component: Wellbeing,
});

function Wellbeing() {
  const queryClient = useQueryClient();
  const [hours, setHours] = useState("7");
  const [quality, setQuality] = useState([3]);
  const [stress, setStress] = useState([5]);
  const [energy, setEnergy] = useState([5]);
  const [social, setSocial] = useState([5]);
  const [notes, setNotes] = useState("");

  const { data } = useQuery({
    queryKey: ["wellbeing"],
    queryFn: async () => {
      const [sleep, checkins] = await Promise.all([
        supabase.from("sleep_logs").select("*").order("log_date", { ascending: false }).limit(14),
        supabase.from("checkins").select("*").order("checkin_date", { ascending: false }).limit(14),
      ]);
      return { sleep: sleep.data ?? [], checkins: checkins.data ?? [] };
    },
  });

  async function logSleep() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("sleep_logs").upsert(
      {
        user_id: auth.user.id,
        log_date: new Date().toISOString().slice(0, 10),
        hours: Number(hours),
        quality: quality[0] ?? 3,
      },
      { onConflict: "user_id,log_date" },
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Sleep logged");
    void queryClient.invalidateQueries();
  }

  async function logCheckin() {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("checkins").upsert(
      {
        user_id: auth.user.id,
        checkin_date: new Date().toISOString().slice(0, 10),
        stress_level: stress[0] ?? 5,
        energy_level: energy[0] ?? 5,
        social_level: social[0] ?? 5,
        notes: notes.trim().slice(0, 500) || null,
      },
      { onConflict: "user_id,checkin_date" },
    );
    if (error) {
      toast.error(error.message);
      return;
    }
    setNotes("");
    toast.success("Daily check-in saved");
    void queryClient.invalidateQueries();
  }

  const sleepChart = (data?.sleep ?? [])
    .slice()
    .reverse()
    .map((s) => ({ date: s.log_date.slice(5), hours: Number(s.hours) }));
  const stressChart = (data?.checkins ?? [])
    .slice()
    .reverse()
    .map((c) => ({
      date: c.checkin_date.slice(5),
      stress: c.stress_level ?? 0,
      energy: c.energy_level ?? 0,
    }));

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Mood, sleep & stress</h1>
          <p className="text-sm text-muted-foreground">
            Small daily signals help us notice when something changes.
          </p>
        </div>

        <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-lg font-semibold">How do you feel right now?</h2>
          <MoodPicker className="mt-4" />
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
            <h2 className="font-display text-lg font-semibold">Sleep tracker</h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Hours slept last night</Label>
                <Input
                  type="number"
                  min={0}
                  max={16}
                  step={0.5}
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Sleep quality: {quality[0]}/5</Label>
                <Slider min={1} max={5} step={1} value={quality} onValueChange={setQuality} />
              </div>
              <Button onClick={() => void logSleep()}>Save sleep</Button>
            </div>
            {sleepChart.length > 0 && (
              <div className="mt-6 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sleepChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" fontSize={12} stroke="var(--color-muted-foreground)" />
                    <YAxis fontSize={12} stroke="var(--color-muted-foreground)" />
                    <Tooltip />
                    <Bar dataKey="hours" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>

          <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
            <h2 className="font-display text-lg font-semibold">Daily check-in</h2>
            <div className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label>Stress level: {stress[0]}/10</Label>
                <Slider min={0} max={10} step={1} value={stress} onValueChange={setStress} />
              </div>
              <div className="space-y-2">
                <Label>Energy level: {energy[0]}/10</Label>
                <Slider min={0} max={10} step={1} value={energy} onValueChange={setEnergy} />
              </div>
              <div className="space-y-2">
                <Label>Social connection: {social[0]}/10</Label>
                <Slider min={0} max={10} step={1} value={social} onValueChange={setSocial} />
              </div>
              <Textarea
                placeholder="Anything you want to note about today?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
              <Button onClick={() => void logCheckin()}>Save check-in</Button>
            </div>
            {stressChart.length > 0 && (
              <div className="mt-6 h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stressChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="date" fontSize={12} stroke="var(--color-muted-foreground)" />
                    <YAxis domain={[0, 10]} fontSize={12} stroke="var(--color-muted-foreground)" />
                    <Tooltip />
                    <Line type="monotone" dataKey="stress" stroke="var(--color-destructive)" strokeWidth={2} />
                    <Line type="monotone" dataKey="energy" stroke="var(--color-primary)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}