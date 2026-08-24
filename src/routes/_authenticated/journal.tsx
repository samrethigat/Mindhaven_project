import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { analyzeJournalEntry } from "@/lib/ai.functions";

export const Route = createFileRoute("/_authenticated/journal")({
  component: Journal,
});

function Journal() {
  const queryClient = useQueryClient();
  const analyze = useServerFn(analyzeJournalEntry);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: entries } = useQuery({
    queryKey: ["journal"],
    queryFn: async () => {
      const { data } = await supabase
        .from("journal_entries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data ?? [];
    },
  });

  async function save() {
    const text = content.trim();
    if (text.length < 5) {
      toast.error("Write a little more before saving.");
      return;
    }
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { data, error } = await supabase
      .from("journal_entries")
      .insert({ user_id: auth.user.id, title: title.trim() || null, content: text })
      .select("id")
      .single();
    if (error || !data) {
      setSaving(false);
      toast.error(error?.message ?? "Could not save");
      return;
    }
    setTitle("");
    setContent("");
    try {
      const res = await analyze({ data: { id: data.id, content: text } });
      toast.success(res.summary);
    } catch {
      toast.success("Entry saved.");
    }
    setSaving(false);
    void queryClient.invalidateQueries({ queryKey: ["journal"] });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Journal</h1>
          <p className="text-sm text-muted-foreground">
            Private to you. Mira reads it only to understand how you&apos;re trending.
          </p>
        </div>

        <Card className="border-0 p-5 shadow-[var(--shadow-soft)]">
          <Input
            placeholder="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            className="mt-3 min-h-40"
            placeholder="What happened today, and how did it feel?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <Button className="mt-3" disabled={saving} onClick={() => void save()}>
            {saving ? "Saving..." : "Save entry"}
          </Button>
        </Card>

        <div className="space-y-3">
          {(entries ?? []).map((e) => (
            <Card key={e.id} className="border-0 p-5 shadow-[var(--shadow-soft)]">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{e.title ?? "Untitled entry"}</p>
                {e.sentiment && (
                  <Badge
                    variant={
                      e.sentiment === "negative"
                        ? "destructive"
                        : e.sentiment === "positive"
                          ? "default"
                          : "secondary"
                    }
                    className="capitalize"
                  >
                    {e.sentiment}
                  </Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(e.created_at).toLocaleString()}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm">{e.content}</p>
            </Card>
          ))}
          {(entries ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No entries yet.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}