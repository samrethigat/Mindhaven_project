import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Messages — MindHaven" },
      { name: "description", content: "Private conversations between students and counsellors." },
    ],
  }),
  component: Messages,
});

function Messages() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["conversations", user?.id],
    enabled: !!user,
    refetchInterval: 20000,
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      const byPeer = new Map<
        string,
        { last: string; at: string; unread: number }
      >();
      for (const m of rows ?? []) {
        const peer = m.sender_id === user!.id ? m.recipient_id : m.sender_id;
        const entry = byPeer.get(peer) ?? { last: "", at: m.created_at, unread: 0 };
        if (!entry.last) {
          entry.last = m.content || `Sent a ${m.kind}`;
          entry.at = m.created_at;
        }
        if (m.recipient_id === user!.id && !m.read_at) entry.unread += 1;
        byPeer.set(peer, entry);
      }
      const ids = [...byPeer.keys()];
      const names = new Map<string, string>();
      if (ids.length) {
        const [{ data: cs }, { data: ss }] = await Promise.all([
          supabase.from("counsellors").select("user_id, full_name").in("user_id", ids),
          supabase.from("students").select("user_id, full_name").in("user_id", ids),
        ]);
        for (const r of [...(cs ?? []), ...(ss ?? [])]) names.set(r.user_id, r.full_name);
      }
      return ids.map((id) => ({ id, name: names.get(id) ?? "Conversation", ...byPeer.get(id)! }));
    },
  });

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground">Your private conversations.</p>
        </div>
        <div className="space-y-3">
          {(data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No conversations yet.</p>
          )}
          {(data ?? []).map((c) => (
            <Link key={c.id} to="/chat/$peerId" params={{ peerId: c.id }}>
              <Card className="flex items-center gap-4 border-0 p-4 shadow-[var(--shadow-soft)] transition-colors hover:bg-accent/30">
                <Avatar>
                  <AvatarFallback>{c.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name}</p>
                  <p className="truncate text-sm text-muted-foreground">{c.last}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">
                    {new Date(c.at).toLocaleDateString()}
                  </p>
                  {c.unread > 0 && <Badge className="mt-1">{c.unread}</Badge>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
