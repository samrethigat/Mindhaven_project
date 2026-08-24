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
  scoreAssessment,
  riskExplanation,
  selfCareSuggestions,
  RISK_LABEL,
  Answers,
  AssessmentResult,
} from "../../lib/assessment";

type Stage = "intro" | "questions" | "result";

const DISCLAIMER =
  "This assessment is for screening/support purposes and is not a medical diagnosis.";

export function AssessmentPage() {
  usePageTitle("Mental Health Assessment");
  const [stage, setStage] = useState<Stage>("intro");
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    api
      .get("/assessment/history")
      .then((res) => setHistory(res.data.history || []))
      .catch(() => {})
      .finally(() => setLoadingHistory(false));
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
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  /* ---------- Intro ---------- */
  if (stage === "intro") {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Mental Health Assessment 📊</h2>
        <div className="card p-6">
          <p className="text-sm text-slate-600">
            This scientific questionnaire helps you understand your current stress, anxiety,
            depression and wellbeing across several areas. It takes about 3–5 minutes.
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {Object.values(DOMAIN_LABEL).map((d) => (
              <span key={d} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-center text-xs font-medium text-slate-600">
                {d}
              </span>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
            ⚠️ {DISCLAIMER}
          </div>
          <div className="mt-4 text-sm text-slate-500">Total questions: {QUESTIONS.length} · Answer honestly.</div>
          <button onClick={() => { setAnswers({}); setIndex(0); setStage("questions"); }} className="btn-primary mt-5">
            Begin Assessment
          </button>
        </div>

        {history.length > 0 && (
          <div className="card p-6">
            <h3 className="mb-3 text-lg font-semibold">Your previous assessments</h3>
            <div className="space-y-2">
              {history.map((h) => (
                <div key={h._id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3 text-sm">
                  <div>
                    <span className="font-semibold">{RISK_LABEL[h.risk as keyof typeof RISK_LABEL] || h.risk}</span>
                    <div className="text-xs text-slate-400">{new Date(h.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-right">
                    <span className="badge bg-blue-100 text-blue-700">Wellbeing {h.wellbeingScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  /* ---------- Result ---------- */
  if (stage === "result" && result) {
    const recs = selfCareSuggestions(result.risk);
    const severe = result.suicidalFlag || result.risk === "level_3";
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold">Your Assessment Result</h2>
        <div className={`card p-6 ${severe ? "border-red-200" : ""}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-slate-500">Overall wellbeing score</p>
              <p className="text-4xl font-extrabold">{result.wellbeingScore}%</p>
            </div>
            <span className={`badge ${severe ? "bg-red-100 text-red-700" : result.risk === "level_2" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
              {RISK_LABEL[result.risk]}
            </span>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
            <div className={`h-2 rounded-full ${severe ? "bg-red-500" : result.risk === "level_2" ? "bg-orange-500" : "bg-green-500"}`} style={{ width: `${result.wellbeingScore}%` }} />
          </div>
          <p className="mt-3 text-sm text-slate-600">{riskExplanation(result.risk, result.suicidalFlag)}</p>
        </div>

        {/* Domain scores */}
        <div className="card p-6">
          <h3 className="mb-3 text-lg font-semibold">Breakdown by area</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(result.scores).map(([domain, score]) => (
              <div key={domain} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{DOMAIN_LABEL[domain as keyof typeof DOMAIN_LABEL]}</span>
                  <span className="text-slate-500">{score}%</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100">
                  <div className={`h-1.5 rounded-full ${score >= 60 ? "bg-red-400" : score >= 40 ? "bg-orange-400" : "bg-green-400"}`} style={{ width: `${score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Next steps */}
        <div className="card p-6">
          <h3 className="mb-3 text-lg font-semibold">Recommended next steps</h3>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            {recs.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/patient/companion" className="btn-primary">🤖 Talk to AI Friend</Link>
            {result.risk !== "level_1" && (
              <Link to="/patient/counselors" className="btn-outline">📅 Book a Counselor</Link>
            )}
            {severe && (
              <Link to="/patient/emergency" className="btn-danger">🚨 Emergency Support</Link>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">⚠️ {DISCLAIMER}</div>
        <button onClick={() => { setStage("intro"); setResult(null); }} className="btn-outline">Back to overview</button>
      </div>
    );
  }

  /* ---------- Questions ---------- */
  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="text-2xl font-bold">Mental Health Assessment 📊</h2>
      <div className="card mt-4 p-6">
        <div className="mb-4 flex items-center justify-between text-sm">
          <span className="badge bg-blue-100 text-blue-700">{DOMAIN_LABEL[current.domain]}</span>
          <span className="text-slate-500">Question {index + 1} of {QUESTIONS.length}</span>
        </div>
        <div className="mb-5 h-1.5 w-full rounded-full bg-slate-100">
          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }} />
        </div>
        <p className="text-lg font-medium">{current.text}</p>
        <div className="mt-5 space-y-2">
          {SCALE.map((label, i) => (
            <button
              key={label}
              onClick={() => select(i)}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-left text-sm transition-colors hover:border-blue-400 hover:bg-blue-50"
            >
              <span className="font-semibold text-blue-700">{i}</span> — {label}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-between">
          <button onClick={goBack} disabled={index === 0} className="btn-outline">Back</button>
          <span className="text-xs text-slate-400">{answeredCount}/{QUESTIONS.length} answered</span>
        </div>
      </div>
    </div>
  );
}
