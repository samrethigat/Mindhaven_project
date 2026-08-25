import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import { Loading } from "../../components/ui/Loading";
import {
  QUESTIONS,
  SCALE,
  DOMAIN_LABEL,
  selfCareSuggestions,
  riskExplanation,
  RISK_LABEL,
  Answers,
  AssessmentResult,
  scoreAssessment,
} from "../../lib/assessment";

type Stage = "intro" | "questions" | "result";

const DISCLAIMER = "This self-assessment tool is designed for psychological screening and self-reflection. It is not a medical diagnostic test.";

export function AssessmentPage() {
  usePageTitle("Candidate Assessment");
  const [stage, setStage] = useState<Stage>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    api
      .get("/assessment/history")
      .then((res) => setHistory(res.data.history || []))
      .catch(() => {});
  }, []);

  const current = QUESTIONS[index];
  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined).length;

  function select(value: number) {
    const next = { ...answers, [current.id]: value };
    setAnswers(next);
    if (index < QUESTIONS.length - 1) {
      setIndex(index + 1);
    } else {
      submit(next);
    }
  }

  function goBack() {
    if (index > 0) setIndex(index - 1);
  }

  async function submit(finalAnswers: Answers) {
    setSubmitting(true);
    try {
      const res = await api.post("/assessment", { answers: finalAnswers });
      setResult(res.data.assessment);
      setStage("result");
      setHistory((prev) => [res.data.assessment, ...prev]);
    } catch (err) {
      // Offline fallback: compute score locally
      const localResult = scoreAssessment(finalAnswers);
      const fallbackAssessment: AssessmentResult & { createdAt?: string } = {
        ...localResult,
        createdAt: new Date().toISOString(),
      };
      setResult(fallbackAssessment as any);
      setStage("result");
      setHistory((prev) => [fallbackAssessment, ...prev]);
      toast.success("Assessment evaluated successfully!");
    } finally {
      setSubmitting(false);
    }
  }

  if (stage === "intro") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Self-Psychological Assessment 📊</h2>
          <p className="text-sm text-slate-500">Standardized screening for stress, anxiety, and depression</p>
        </div>
        
        <div className="card p-6">
          <p className="text-sm text-slate-600">
            This confidential questionnaire evaluates your current emotional state and wellbeing across multiple psychological domains. It takes approximately 3–5 minutes.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {Object.values(DOMAIN_LABEL).map((d) => (
              <span key={d} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-slate-700">
                {d}
              </span>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800">
            ⚠️ {DISCLAIMER}
          </div>
          <div className="mt-4 text-xs text-slate-400">Total questions: {QUESTIONS.length}</div>
          <button onClick={() => { setAnswers({}); setIndex(0); setStage("questions"); }} className="btn-primary bg-teal-600 hover:bg-teal-700 border-none mt-5 text-sm">
            Begin Assessment
          </button>
        </div>

        {history.length > 0 && (
          <div className="card p-6">
            <h3 className="mb-3 text-base font-bold text-slate-800">Your Previous Assessment History</h3>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h._id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{RISK_LABEL[h.risk as keyof typeof RISK_LABEL] || h.risk}</span>
                    <div className="text-slate-400">{new Date(h.createdAt).toLocaleString()}</div>
                  </div>
                  <span className="badge bg-teal-100 text-teal-800 font-bold">Wellbeing {h.wellbeingScore}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (stage === "result" && result) {
    const recs = selfCareSuggestions(result.risk);
    const severe = result.suicidalFlag || result.risk === "level_3";
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-slate-800">Assessment Results & Recommendations</h2>
        <div className={`card p-6 ${severe ? "border-rose-200 bg-rose-50/40" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Overall Wellbeing Score</p>
              <p className="text-4xl font-extrabold text-slate-900">{result.wellbeingScore}%</p>
            </div>
            <span className={`badge ${severe ? "bg-rose-100 text-rose-800" : result.risk === "level_2" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"} text-sm py-1 px-3 font-bold`}>
              {RISK_LABEL[result.risk]}
            </span>
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-slate-100">
            <div className={`h-2 rounded-full ${severe ? "bg-rose-500" : result.risk === "level_2" ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${result.wellbeingScore}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-700">{riskExplanation(result.risk, result.suicidalFlag)}</p>
        </div>

        <div className="card p-6">
          <h3 className="mb-3 text-base font-bold text-slate-800">Domain Breakdown</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(result.scores).map(([domain, score]) => (
              <div key={domain} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800">{DOMAIN_LABEL[domain as keyof typeof DOMAIN_LABEL]}</span>
                  <span className="text-slate-500">{score}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                  <div className={`h-1.5 rounded-full ${score >= 60 ? "bg-rose-400" : score >= 40 ? "bg-amber-400" : "bg-emerald-400"}`} style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-3 text-base font-bold text-slate-800">Recommended Next Steps</h3>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-600">
            {recs.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/candidate/companion" className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs">🤖 AI Companion Check-in</Link>
            <Link to="/candidate/counselors" className="btn-outline text-xs">📅 Book a Counselor Session</Link>
            {severe && (
              <Link to="/candidate/emergency" className="btn-danger text-xs">🚨 Emergency Support</Link>
            )}
          </div>
        </div>

        <button onClick={() => { setStage("intro"); setResult(null); }} className="btn-outline text-xs">Retake Assessment</button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold text-slate-800">Self-Assessment Questionnaire</h2>
      <div className="card mt-4 p-6">
        <div className="mb-4 flex items-center justify-between text-xs">
          <span className="badge bg-teal-100 text-teal-800 font-bold">{DOMAIN_LABEL[current.domain]}</span>
          <span className="text-slate-500">Question {index + 1} of {QUESTIONS.length}</span>
        </div>
        <div className="mb-5 h-1.5 w-full rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-teal-600" style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }} />
        </div>
        <p className="text-lg font-semibold text-slate-900">{current.text}</p>
        <div className="mt-5 space-y-2">
          {SCALE.map((label, i) => (
            <button
              key={label}
              onClick={() => select(i)}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm transition-colors hover:border-teal-400 hover:bg-teal-50"
            >
              <span className="font-bold text-teal-700">{i}</span> — {label}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-between">
          <button onClick={goBack} disabled={index === 0} className="btn-outline text-xs">Back</button>
          <span className="text-xs text-slate-400">{answeredCount}/{QUESTIONS.length} answered</span>
        </div>
      </div>
    </div>
  );
}
