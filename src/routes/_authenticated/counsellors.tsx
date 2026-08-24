import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { AppointmentBookingDialog } from "@/components/AppointmentBookingDialog";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BadgeCheck, MapPin, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/counsellors")({
  component: Counsellors,
});

type Counsellor = {
  id: string;
  user_id: string;
  full_name: string;
  specialization: string | null;
  qualification: string | null;
  experience_years: number | null;
  hospital: string | null;
  clinic: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
  availability: string | null;
  is_available: boolean;
  verified: boolean;
};

function Counsellors() {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Counsellor | null>(null);

  const { data } = useQuery({
    queryKey: ["counsellors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("counsellors")
        .select(
          "id, user_id, full_name, specialization, qualification, experience_years, hospital, clinic, city, state, bio, availability, is_available, verified",
        )
        .eq("is_deleted", false)
        .order("is_available", { ascending: false });
      return (data ?? []) as Counsellor[];
    },
  });

  const filtered = (data ?? []).filter((c) =>
    `${c.full_name} ${c.specialization ?? ""} ${c.city ?? ""} ${c.hospital ?? ""}`
      .toLowerCase()
      .includes(q.toLowerCase()),
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Find a counsellor</h1>
          <p className="text-sm text-muted-foreground">
            Verified psychologists and psychiatrists you can talk to by chat, voice or video.
          </p>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name, speciality or city"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Card key={c.id} className="glass border-0 p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-lg font-semibold">{c.full_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {c.specialization ?? "Counselling psychologist"}
                  </p>
                </div>
                {c.verified && <BadgeCheck className="size-5 text-primary" />}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant={c.is_available ? "default" : "secondary"}>
                  {c.is_available ? "Available now" : "Busy"}
                </Badge>
                {c.experience_years != null && (
                  <Badge variant="outline">{c.experience_years} yrs experience</Badge>
                )}
              </div>
              {(c.city || c.hospital) && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" />
                  {[c.hospital ?? c.clinic, c.city, c.state].filter(Boolean).join(", ")}
                </p>
              )}
              {c.bio && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{c.bio}</p>}
              <div className="mt-4 flex gap-2">
                <Button className="flex-1" onClick={() => setSelected(c)}>
                  📅 Book Appointment
                </Button>
                {(c.city || c.hospital) && (
                  <Button asChild variant="outline">
                    <a
                      target="_blank"
                      rel="noreferrer"
                      href={`https://www.google.com/maps/search/${encodeURIComponent(
                        [c.hospital ?? c.clinic, c.city, c.state].filter(Boolean).join(" "),
                      )}`}
                    >
                      Map
                    </a>
                  </Button>
                )}
              </div>
            </Card>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No counsellors match your search yet.
            </p>
          )}
        </div>
      </div>

      <AppointmentBookingDialog
        counsellor={selected ? { user_id: selected.user_id, full_name: selected.full_name } : null}
        onOpenChange={(o) => !o && setSelected(null)}
      />
    </AppShell>
  );
}