import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  QUESTIONS,
  SCALE,
  DOMAIN_LABEL,
  RISK_LABEL,
  scoreAssessment,
  type Answers,
} from "@/lib/assessment";
import { triggerEmergency } from "@/lib/emergency.functions";
import { detectEmergency } from "@/lib/emergency-detection";

export const Route = createFileRoute("/_authenticated/assessment")({
  component: AssessmentPage,
});

const PAGE_SIZE = 5;

function AssessmentPage() {
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answers>({});
  const [page, setPage] = useState(0);
  const [saving, setSaving] = useState(false);

  const pages = Math.ceil(QUESTIONS.length / PAGE_SIZE);
  const slice = QUESTIONS.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  const answered = Object.keys(answers).length;

  async function submit() {
    if (answered < QUESTIONS.length) {
      toast.error("Please answer every question — it keeps your results accurate.");
      return;
    }
    setSaving(true);
    const result = scoreAssessment(answers);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    const { error } = await supabase.from("assessments").insert({
      user_id: auth.user.id,
      answers,
      scores: result.scores,
      total_score: result.totalScore,
      wellbeing_score: result.wellbeingScore,
      risk: result.risk,
      suicidal_flag: result.suicidalFlag,
    });
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (result.risk === "level_3" || result.suicidalFlag) {
      try {
        const signal = detectEmergency({
          scores: result.scores,
          risk: result.risk,
          suicidalFlag: result.suicidalFlag,
        });
        await triggerEmergency({
          data: {
            source: "assessment",
            summary: "High-risk psychological assessment result",
            reason: signal.reasons.join(", ") || "High-risk assessment result",
            mentalStatus: signal.mentalStatus,
            aiScore: signal.aiScore,
          },
        });
      } catch {
        /* escalation is best-effort from the client */
      }
      toast.error("We're connecting you with a counsellor right now.");
      void navigate({ to: "/emergency" });
      return;
    }
    toast.success(`Assessment complete — ${RISK_LABEL[result.risk]}`);
    void navigate({ to: "/dashboard" });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Your wellbeing check</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            40 short questions about the last two weeks. There are no wrong answers.
          </p>
          <Progress value={(answered / QUESTIONS.length) * 100} className="mt-3" />
          <p className="mt-2 text-xs text-muted-foreground">
            {answered}/{QUESTIONS.length} answered
          </p>
        </div>

        <Card className="border-0 p-6 shadow-[var(--shadow-soft)]">
          <div className="space-y-8">
            {slice.map((q, i) => (
              <div key={q.id}>
                <p className="text-xs font-medium uppercase tracking-wide text-primary">
                  {DOMAIN_LABEL[q.domain]}
                </p>
                <p className="mt-1 font-medium">
                  {page * PAGE_SIZE + i + 1}. {q.text}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {SCALE.map((label, value) => {
                    const active = answers[q.id] === value;
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: value }))}
                        className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                          active
                            ? "gradient-primary border-transparent text-primary-foreground"
                            : "border-border hover:border-primary"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-between gap-3">
            <Button variant="ghost" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
              Back
            </Button>
            <span className="text-xs text-muted-foreground">
              Page {page + 1} of {pages}
            </span>
            {page < pages - 1 ? (
              <Button onClick={() => setPage((p) => p + 1)}>Next</Button>
            ) : (
              <Button disabled={saving} onClick={() => void submit()}>
                {saving ? "Scoring..." : "See my results"}
              </Button>
            )}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}