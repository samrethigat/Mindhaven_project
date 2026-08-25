import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
import { useTheme } from "../../context/ThemeContext";
import { usePageTitle } from "../../lib/usePageTitle";
import { api, getErrorMessage } from "../../lib/api";
import {
  ASSESSMENT_QUESTIONS,
  RESPONSE_SCALE,
  CATEGORIES,
  ASSESSMENT_DISCLAIMER,
  AssessmentResult,
  getLevelBadgeClass,
  getScoreBarColor,
  scoreAssessmentLocally,
  getRadarCoordinates,
} from "../../lib/assessment";
import {
  Brain,
  Sparkles,
  Heart,
  GraduationCap,
  Users,
  Shield,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Calendar,
  Clock,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Music,
  MessageSquare,
  UserCheck,
  Check,
  Send,
  Eye,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

type Stage = "intro" | "questions" | "result";

export function AssessmentPage() {
  const { language } = useLanguage();
  const { isDark } = useTheme();
  usePageTitle("Psychology & Mindset Assessment");

  const [activeTab, setActiveTab] = useState<"assessment" | "history">("assessment");
  const [stage, setStage] = useState<Stage>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  async function loadHistory() {
    setLoadingHistory(true);
    try {
      const res = await api.get("/assessment/history");
      const list = res.data.history || [];
      setHistory(list);
    } catch {
      // Graceful fallback
    } finally {
      setLoadingHistory(false);
    }
  }

  const currentQ = ASSESSMENT_QUESTIONS[currentIndex];
  const currentCat = CATEGORIES[currentQ?.category || "emotional"];
  const answeredCount = Object.keys(answers).filter((k) => answers[k] !== undefined).length;
  const isCurrentAnswered = answers[`q${currentQ?.id}`] !== undefined;
  const isAllAnswered = answeredCount === ASSESSMENT_QUESTIONS.length;
  const progressPercentage = Math.round(((currentIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100 * 10) / 10;

  function handleSelectOption(value: number) {
    const nextAnswers = { ...answers, [`q${currentQ.id}`]: value };
    setAnswers(nextAnswers);

    // Auto-advance smoothly if not at the last question
    if (currentIndex < ASSESSMENT_QUESTIONS.length - 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 180);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function handleNext() {
    if (!isCurrentAnswered) {
      toast.error("Please select an answer for the current question before proceeding.");
      return;
    }
    if (currentIndex < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (isAllAnswered) {
      setShowConfirmModal(true);
    }
  }

  async function handleConfirmSubmit() {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      const res = await api.post("/assessment/submit", { answers });
      const savedAssessment = res.data.assessment;
      setResult(savedAssessment);
      setStage("result");
      setHistory((prev) => [savedAssessment, ...prev.filter((h) => h._id !== savedAssessment._id)]);
      toast.success("Assessment evaluated successfully ✨");
    } catch (err) {
      // Robust offline / local evaluation fallback
      const localResult = scoreAssessmentLocally(answers);
      setResult(localResult);
      setStage("result");
      setHistory((prev) => [localResult, ...prev]);
      toast.success("Assessment evaluated successfully!");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRetake() {
    setAnswers({});
    setCurrentIndex(0);
    setResult(null);
    setStage("questions");
  }

  // Radar chart data for Results
  const radarScores = useMemo(() => {
    if (!result?.categoryScores) return [50, 50, 50, 50, 50];
    return [
      result.categoryScores.emotional?.percentage || 50,
      result.categoryScores.academic?.percentage || 50,
      result.categoryScores.selfConfidence?.percentage || 50,
      result.categoryScores.social?.percentage || 50,
      result.categoryScores.coping?.percentage || 50,
    ];
  }, [result]);

  return (
    <div className="space-y-8 pb-32 max-w-5xl mx-auto">
      {/* 🌟 Professional Header Card */}
      <div className="card p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Brain className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Psychology & Well-Being Screening</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Psychology & Mindset Assessment
            </h1>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              Take a few minutes to understand your current well-being, stress, coping patterns and mindset.
            </p>
          </div>

          {/* Navigation Tab Bar */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => {
                setActiveTab("assessment");
                if (result) setStage("result");
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "assessment"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              📝 Take Assessment
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "history"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              📊 Assessment History ({history.length})
            </button>
          </div>
        </div>
      </div>

      {/* 📊 TAB 2: ASSESSMENT HISTORY */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span>Your Previous Assessments</span>
            </h2>
            <button
              onClick={() => {
                setActiveTab("assessment");
                setStage("questions");
                setAnswers({});
                setCurrentIndex(0);
              }}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Take New Assessment</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="card p-10 text-center space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Brain className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                No previous assessments found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Complete your first 40-question assessment to generate your personalized mindset profile and track your growth over time.
              </p>
              <button
                onClick={() => {
                  setActiveTab("assessment");
                  setStage("questions");
                }}
                className="btn-primary text-xs"
              >
                Start Assessment Now
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, idx) => {
                const isLatest = idx === 0;
                return (
                  <div
                    key={item._id || idx}
                    className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">
                          {item.mindsetProfile || "Well-Being Assessment"}
                        </span>
                        {isLatest && (
                          <span className="badge bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(item.completedAt || item.createdAt || Date.now()).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </span>
                      </p>
                      {item.summary && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 max-w-xl">
                          {item.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                          Overall Score
                        </span>
                        <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                          {item.overallPercentage}%
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setResult(item);
                          setActiveTab("assessment");
                          setStage("result");
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Results</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 📝 TAB 1: ASSESSMENT FLOW */}
      {activeTab === "assessment" && (
        <>
          {/* 1. INTRO STAGE */}
          {stage === "intro" && (
            <div className="space-y-6">
              <div className="card p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 transition-colors">
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    Purpose of This Assessment
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    This confidential self-assessment evaluates 5 fundamental domains of student psychological health and mindset. It takes approximately 4–6 minutes to answer 40 reflective questions.
                  </p>
                </div>

                {/* 5 Domains Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.values(CATEGORIES).map((cat) => (
                    <div
                      key={cat.id}
                      className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/50 space-y-1.5"
                    >
                      <span className="text-xs font-extrabold text-blue-600 dark:text-blue-400 block">
                        {cat.title}
                      </span>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Non-Diagnostic Safety Disclaimer Alert */}
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">⚠️ Important Screening Notice:</span>
                    <span>{ASSESSMENT_DISCLAIMER}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    <span>40 Questions · 5-Point Response Scale · Confidential & Private</span>
                  </div>

                  <button
                    onClick={() => {
                      setAnswers({});
                      setCurrentIndex(0);
                      setStage("questions");
                    }}
                    className="btn-primary text-sm px-6 py-3 shadow-md shadow-blue-500/20 flex items-center gap-2"
                  >
                    <span>Begin Assessment</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. QUESTION STEPPER STAGE */}
          {stage === "questions" && (
            <div className="space-y-6">
              {/* Stepper Header */}
              <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-extrabold text-xs">
                      {currentCat.title}
                    </span>
                    <span className="text-slate-400 font-medium hidden sm:inline">
                      (Q{currentCat.questions[0]}–Q{currentCat.questions[currentCat.questions.length - 1]})
                    </span>
                  </div>

                  <span className="font-extrabold text-slate-900 dark:text-white">
                    Question {currentIndex + 1} of {ASSESSMENT_QUESTIONS.length}
                    <span className="text-slate-400 dark:text-slate-500 font-medium ml-2">
                      ({progressPercentage}%)
                    </span>
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-blue-600 dark:bg-blue-500 transition-all duration-300"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="card p-6 sm:p-10 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 transition-colors">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Question #{currentQ.id}
                  </span>
                  {/* High contrast Question text (Black in Light Mode, White in Dark Mode) */}
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-snug">
                    {currentQ.text}
                  </h3>
                </div>

                {/* 5 Response Scale Options */}
                <div className="space-y-3 pt-2">
                  {RESPONSE_SCALE.map((opt) => {
                    const isSelected = answers[`q${currentQ.id}`] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleSelectOption(opt.value)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 dark:bg-blue-950/70 border-blue-600 dark:border-blue-500 ring-2 ring-blue-500/20 shadow-sm"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500/60 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          {/* Radio Indicator (○ unselected / ● selected) */}
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-colors ${
                              isSelected
                                ? "border-blue-600 bg-blue-600 text-white"
                                : "border-slate-300 dark:border-slate-600 bg-transparent text-transparent"
                            }`}
                          >
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>

                          <div>
                            {/* High Contrast Option Label */}
                            <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-slate-100 block">
                              {opt.label}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {opt.description}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                            <Check className="w-4 h-4" />
                            <span>Selected</span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800 gap-3">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="btn-outline text-xs px-5 py-2.5 flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    {answeredCount} of 40 answered
                  </span>

                  {currentIndex < ASSESSMENT_QUESTIONS.length - 1 ? (
                    <button
                      onClick={handleNext}
                      disabled={!isCurrentAnswered}
                      className="btn-primary text-xs px-5 py-2.5 flex items-center gap-1.5"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={!isAllAnswered}
                      className="btn-primary text-xs px-6 py-2.5 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/20"
                    >
                      <span>Submit Assessment</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Jump-to-Question Matrix */}
              <div className="card p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 transition-colors">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block">
                  Question Navigation Grid (1–40):
                </span>
                <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-20 gap-1.5">
                  {ASSESSMENT_QUESTIONS.map((q, idx) => {
                    const isAnswered = answers[`q${q.id}`] !== undefined;
                    const isCurrent = currentIndex === idx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                          isCurrent
                            ? "bg-blue-600 text-white ring-2 ring-blue-400 scale-105"
                            : isAnswered
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                        title={`Go to Question ${q.id}`}
                      >
                        {q.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. RESULTS DASHBOARD STAGE */}
          {stage === "result" && result && (
            <div className="space-y-6">
              {/* Header: Your Assessment Results */}
              <div className="card p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md space-y-6 transition-colors">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="space-y-2 text-center md:text-left">
                    <span className="badge bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-extrabold px-3 py-1">
                      Mindset Profile: {result.mindsetProfile}
                    </span>

                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                      Your Assessment Results
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                      {result.summary ||
                        "Your responses have been mathematically evaluated across the 5 core psychological domains."}
                    </p>
                  </div>

                  {/* Circular / Radial Overall Score */}
                  <div className="flex flex-col items-center justify-center p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-inner flex-shrink-0 w-48 text-center">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Overall Well-Being
                    </span>
                    <span className="text-4xl sm:text-5xl font-black text-blue-600 dark:text-blue-400 my-1">
                      {result.overallPercentage}%
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                      Raw Score: {result.overallScore} / 200
                    </span>
                  </div>
                </div>
              </div>

              {/* Radar Chart & Domain Overview Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* SVG Radar Chart Card */}
                <div className="card p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center space-y-3">
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5 self-start">
                    <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Domain Balance Radar</span>
                  </h3>

                  <div className="relative w-52 h-52 flex items-center justify-center">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                      {/* Background web circles */}
                      <circle cx="100" cy="100" r="70" fill="none" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="1" strokeDasharray="3,3" />
                      <circle cx="100" cy="100" r="46" fill="none" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="1" strokeDasharray="3,3" />
                      <circle cx="100" cy="100" r="23" fill="none" stroke={isDark ? "#334155" : "#e2e8f0"} strokeWidth="1" strokeDasharray="3,3" />

                      {/* Axes */}
                      {[0, 1, 2, 3, 4].map((i) => {
                        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2;
                        const x2 = 100 + 70 * Math.cos(angle);
                        const y2 = 100 + 70 * Math.sin(angle);
                        return <line key={i} x1="100" y1="100" x2={x2} y2={y2} stroke={isDark ? "#475569" : "#cbd5e1"} strokeWidth="1" />;
                      })}

                      {/* Radar Polygon */}
                      <polygon
                        points={getRadarCoordinates(radarScores, 100, 70)}
                        fill="rgba(37, 99, 235, 0.25)"
                        stroke="#2563eb"
                        strokeWidth="2.5"
                      />
                    </svg>
                  </div>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 text-center font-medium">
                    Evaluates balance across Emotional, Academic, Confidence, Social, and Coping patterns.
                  </div>
                </div>

                {/* 5 Category Score Cards Grid (Span 2) */}
                <div className="lg:col-span-2 space-y-3">
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <span>Five Category Scores & Well-Being Ranges</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.entries(result.categoryScores || {}).map(([key, cat]) => {
                      const meta = CATEGORIES[key as keyof typeof CATEGORIES];
                      if (!meta) return null;
                      const badgeClasses = getLevelBadgeClass(cat.level);
                      const barColor = getScoreBarColor(cat.percentage);

                      return (
                        <div
                          key={key}
                          className="card p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-700 transition-all shadow-sm"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                                {meta.title}
                              </span>
                              <span className="text-sm font-black text-slate-900 dark:text-white">
                                {cat.percentage}%
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                              {meta.description}
                            </p>
                          </div>

                          <div className="space-y-2 pt-1">
                            {/* Progress Bar */}
                            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full ${barColor} transition-all duration-500`}
                                style={{ width: `${cat.percentage}%` }}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeClasses.bg} ${badgeClasses.text} ${badgeClasses.border}`}
                              >
                                {cat.level}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {cat.score} / 40
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Strengths & Areas to Focus On */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="card p-6 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 shadow-sm space-y-3">
                  <h4 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Your Strengths</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {(result.strengths || []).map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">•</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Areas to Focus On */}
                <div className="card p-6 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/60 shadow-sm space-y-3">
                  <h4 className="font-extrabold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Areas to Mindfully Focus On</span>
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {(result.areasToFocus || []).map((a, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-600 font-bold">•</span>
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Actionable Practical Suggestions */}
              <div className="card p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Personalized Actionable Suggestions</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(result.recommendations || []).map((rec, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2.5"
                    >
                      <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <span className="leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Steps & Support Links */}
              <div className="card p-6 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Recommended Student Resources
                </h4>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/candidate/music"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white hover:border-emerald-500 transition-all shadow-sm"
                  >
                    <Music className="w-4 h-4 text-emerald-500" />
                    <span>Listen to Relaxing Music</span>
                  </Link>

                  <Link
                    to="/candidate/ai-chat"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white hover:border-blue-500 transition-all shadow-sm"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>Talk with Mira AI Assistant</span>
                  </Link>

                  <Link
                    to="/candidate/counselors"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white hover:border-teal-500 transition-all shadow-sm"
                  >
                    <UserCheck className="w-4 h-4 text-teal-500" />
                    <span>Book a Counselor Session</span>
                  </Link>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  <span>
                    Completed on {new Date(result.completedAt || result.createdAt || Date.now()).toLocaleString()}
                  </span>
                  <button
                    onClick={handleRetake}
                    className="text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retake Assessment</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ⚠️ Confirmation Modal Before Final Submission */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="card p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full space-y-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                Submit Assessment?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Are you sure you want to submit your assessment? You will not be able to change your answers after submission.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 space-y-1 text-left">
              <p>✓ All 40 questions answered</p>
              <p>✓ Secure mathematical calculation</p>
              <p>✓ 100% Private to your student account</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={submitting}
                className="btn-outline text-xs px-5 py-2.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={submitting}
                className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2"
              >
                {submitting ? (
                  <span>Evaluating...</span>
                ) : (
                  <>
                    <span>Submit Assessment</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
