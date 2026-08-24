import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/admin")({
  component: Admin,
});

function Admin() {
  const { data } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [students, counsellors, alerts, appointments] = await Promise.all([
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("counsellors").select("id", { count: "exact", head: true }),
        supabase.from("emergency_alerts").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }),
      ]);
      return {
        students: students.count ?? 0,
        counsellors: counsellors.count ?? 0,
        alerts: alerts.count ?? 0,
        appointments: appointments.count ?? 0,
      };
    },
  });

  const { data: deletions } = useQuery({
    queryKey: ["admin-deletions"],
    queryFn: async () => {
      const { data } = await supabase
        .from("account_deletions")
        .select("*")
        .order("deleted_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  const stats = [
    ["Students", data?.students],
    ["Counsellors", data?.counsellors],
    ["Emergency alerts", data?.alerts],
    ["Appointments", data?.appointments],
  ] as const;

  return (
    <AppShell>
      <div className="space-y-6">
        <h1 className="font-display text-2xl font-bold">Admin overview</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(([label, value]) => (
            <Card key={label} className="glass border-0 p-5">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="font-display mt-2 text-3xl font-extrabold">{value ?? "—"}</p>
            </Card>
          ))}
        </div>

        <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
          <h2 className="font-display text-lg font-semibold">Deleted accounts audit</h2>
          {(deletions ?? []).length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">No deleted accounts.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {(deletions ?? []).map((d) => (
                <li key={d.id} className="rounded-xl border p-3 text-sm">
                  <p className="font-medium">
                    {d.full_name} <span className="text-muted-foreground">· {d.email}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {d.role} · ID {d.user_id.slice(0, 8)} · {new Date(d.deleted_at).toLocaleString()}
                    {d.reason ? ` · reason: ${d.reason}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppShell>
  );
}