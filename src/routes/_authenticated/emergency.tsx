import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { triggerEmergency } from "@/lib/emergency.functions";
import { LifeBuoy, Phone } from "lucide-react";

export const Route = createFileRoute("/_authenticated/emergency")({
  component: Emergency,
});

const HELPLINES = [
  { name: "Tele-MANAS (India, 24x7)", number: "14416" },
  { name: "KIRAN Mental Health Helpline", number: "1800-599-0019" },
  { name: "AASRA Suicide Prevention", number: "+91-9820466726" },
  { name: "Emergency services", number: "112" },
];

const BREATH = ["Breathe in… 4", "Hold… 4", "Breathe out… 6", "Rest… 2"];

function Emergency() {
  const raise = useServerFn(triggerEmergency);
  const [sending, setSending] = useState(false);
  const [breathStep, setBreathStep] = useState(0);
  const [breathing, setBreathing] = useState(false);

  useEffect(() => {
    if (!breathing) return;
    const t = setInterval(() => setBreathStep((s) => (s + 1) % BREATH.length), 4000);
    return () => clearInterval(t);
  }, [breathing]);

  const { data: alerts, refetch } = useQuery({
    queryKey: ["my-alerts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("emergency_alerts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  async function sos() {
    setSending(true);
    let coords: { lat: number | null; lng: number | null } = { lat: null, lng: null };
    try {
      const pos = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, { timeout: 6000 }),
      );
      coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      /* location optional */
    }
    try {
      const res = await raise({
        data: {
          summary: "Student pressed the emergency help button",
          source: "manual",
          ...coords,
        },
      });
      toast.success(
        res.counsellorName
          ? `${res.counsellorName} has been alerted and is joining you.`
          : "Help has been alerted. Stay with us.",
      );
      void refetch();
    } catch {
      toast.error("We couldn't reach the network. Please call a helpline below now.");
    } finally {
      setSending(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Emergency help</h1>
          <p className="text-sm text-muted-foreground">
            If you are in immediate danger, call a helpline below. You matter, and this feeling can
            pass.
          </p>
        </div>

        <Card className="border-0 bg-destructive p-6 text-destructive-foreground">
          <h2 className="font-display text-xl font-bold">I need help right now</h2>
          <p className="mt-1 text-sm opacity-90">
            This alerts the nearest available counsellor, books an immediate consultation and
            notifies your trusted contacts.
          </p>
          <Button
            variant="secondary"
            size="lg"
            className="mt-4 w-full"
            disabled={sending}
            onClick={() => void sos()}
          >
            <LifeBuoy className="size-5" />
            {sending ? "Getting help…" : "Send SOS"}
          </Button>
        </Card>

        <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-lg font-semibold">24x7 helplines</h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {HELPLINES.map((h) => (
              <a
                key={h.number}
                href={`tel:${h.number}`}
                className="flex items-center gap-3 rounded-xl border p-3 transition-colors hover:border-primary"
              >
                <Phone className="size-4 text-primary" />
                <span>
                  <span className="block text-sm font-medium">{h.name}</span>
                  <span className="block text-xs text-muted-foreground">{h.number}</span>
                </span>
              </a>
            ))}
          </div>
        </Card>

        <Card className="glass border-0 p-6 text-center">
          <h2 className="font-display text-lg font-semibold">Ground yourself</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A 4-4-6 breathing cycle to slow your body down.
          </p>
          <div
            className={`mx-auto mt-6 flex size-40 items-center justify-center rounded-full gradient-primary text-primary-foreground transition-transform duration-[3500ms] ${
              breathing && breathStep === 0 ? "scale-110" : "scale-90"
            }`}
          >
            <span className="font-display text-lg font-semibold">
              {breathing ? BREATH[breathStep] : "Ready?"}
            </span>
          </div>
          <Button className="mt-6" variant="outline" onClick={() => setBreathing((b) => !b)}>
            {breathing ? "Stop" : "Start breathing exercise"}
          </Button>
        </Card>

        {(alerts ?? []).length > 0 && (
          <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
            <h2 className="font-display text-lg font-semibold">Recent alerts</h2>
            <ul className="mt-3 space-y-2">
              {alerts!.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3">
                  <span className="text-sm">
                    {a.summary}
                    <span className="block text-xs text-muted-foreground">
                      {new Date(a.created_at).toLocaleString()}
                    </span>
                  </span>
                  <Badge variant={a.resolved ? "secondary" : "destructive"}>
                    {a.resolved ? "Resolved" : "Active"}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </AppShell>
  );
}