import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const MOODS = [
  { emoji: "😄", label: "Great", score: 9 },
  { emoji: "🙂", label: "Good", score: 7 },
  { emoji: "😐", label: "Okay", score: 5 },
  { emoji: "😔", label: "Low", score: 3 },
  { emoji: "😢", label: "Awful", score: 1 },
];

export function MoodPicker({ className = "" }: { className?: string }) {
  const [saving, setSaving] = useState<string | null>(null);
  const queryClient = useQueryClient();

  async function save(mood: (typeof MOODS)[number]) {
    const { data: session } = await supabase.auth.getUser();
    if (!session.user) return;
    setSaving(mood.label);
    const { error } = await supabase.from("mood_entries").insert({
      user_id: session.user.id,
      mood: mood.label,
      mood_score: mood.score,
    });
    setSaving(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Logged: ${mood.emoji} ${mood.label}`);
    void queryClient.invalidateQueries();
  }

  return (
    <div className={`flex flex-wrap gap-3 ${className}`}>
      {MOODS.map((m) => (
        <button
          key={m.label}
          type="button"
          disabled={saving !== null}
          onClick={() => void save(m)}
          className="flex min-w-20 flex-col items-center gap-1 rounded-2xl border border-border bg-card px-4 py-3 transition-all hover:-translate-y-0.5 hover:border-primary disabled:opacity-60"
        >
          <span className="text-2xl">{m.emoji}</span>
          <span className="text-xs text-muted-foreground">{m.label}</span>
        </button>
      ))}
    </div>
  );
}