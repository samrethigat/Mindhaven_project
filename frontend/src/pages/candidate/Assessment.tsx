import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../../context/LanguageContext";
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
} from "lucide-react";
import toast from "react-hot-toast";

type Stage = "intro" | "questions" | "confirm" | "result";

export function AssessmentPage() {
  const { language, t } = useLanguage();
  usePageTitle(language === "ta" ? "உளவியல் மற்றும் மனநிலை மதிப்பீடு" : "Psychology & Mindset Assessment");

  const [activeTab, setActiveTab] = useState<"assessment" | "history">("assessment");
  const [stage, setStage] = useState<Stage>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [history, setHistory] = useState<AssessmentResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<AssessmentResult | null>(null);

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
  const isAllAnswered = answeredCount === ASSESSMENT_QUESTIONS.length;

  function handleSelectOption(value: number) {
    const nextAnswers = { ...answers, [`q${currentQ.id}`]: value };
    setAnswers(nextAnswers);

    // Auto-advance to next question
    if (currentIndex < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  }

  function handlePrev() {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  }

  function handleNext() {
    if (currentIndex < ASSESSMENT_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (isAllAnswered) {
      setStage("confirm");
    }
  }

  async function handleSubmitAssessment() {
    if (!isAllAnswered) {
      toast.error(language === "ta" ? "அனைத்து 40 கேள்விகளுக்கும் பதிலளிக்கவும்" : "Please answer all 40 questions before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/assessment/submit", { answers });
      const savedAssessment = res.data.assessment;
      setResult(savedAssessment);
      setStage("result");
      setHistory((prev) => [savedAssessment, ...prev.filter((h) => h._id !== savedAssessment._id)]);
      toast.success(language === "ta" ? "மதிப்பீடு வெற்றிகரமாக நிறைவடைந்தது ✨" : "Assessment evaluated successfully ✨");
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

  return (
    <div className="space-y-8 pb-32 max-w-5xl mx-auto">
      {/* 🌟 Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950 p-6 sm:p-10 text-white shadow-2xl border border-indigo-800/40">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
            <Brain className="w-3.5 h-3.5 text-indigo-400" />
            <span>{language === "ta" ? "உளவியல் மற்றும் மனநிலை சுய மதிப்பீடு" : "Psychology & Well-Being Screening"}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <span>{language === "ta" ? "மாணவர் உளவியல் & மனநிலை மதிப்பீடு" : "Psychology & Mindset Assessment"}</span>
          </h1>

          <p className="text-xs sm:text-sm text-indigo-100/80 max-w-2xl leading-relaxed">
            {language === "ta"
              ? "உங்கள் உணர்ச்சி சமநிலை, கல்வி அழுத்தம், சுயநம்பிக்கை மற்றும் சவால்களை எதிர்கொள்ளும் திறனை அறிய 40 கேள்விகள் கொண்ட ஆய்வு."
              : "A scientifically structured 40-question self-reflection screening to understand your emotional patterns, academic balance, confidence, and resilience."}
          </p>

          {/* Navigation Tab Bar */}
          <div className="pt-4 flex items-center gap-3">
            <button
              onClick={() => { setActiveTab("assessment"); if (result) setStage("result"); }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "assessment"
                  ? "bg-white text-indigo-950 shadow-md scale-105"
                  : "bg-indigo-950/60 text-indigo-200 hover:bg-indigo-900/60"
              }`}
            >
              📝 {language === "ta" ? "மதிப்பீடு" : "Assessment"}
            </button>
            <button
              onClick={() => { setActiveTab("history"); }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === "history"
                  ? "bg-white text-indigo-950 shadow-md scale-105"
                  : "bg-indigo-950/60 text-indigo-200 hover:bg-indigo-900/60"
              }`}
            >
              📊 {language === "ta" ? "முந்தைய வரலாறு" : "Assessment History"} ({history.length})
            </button>
          </div>
        </div>
      </div>

      {/* 📊 TAB 2: HISTORY VIEW */}
      {activeTab === "history" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>{language === "ta" ? "உங்கள் முந்தைய மதிப்பீடுகள்" : "Your Assessment History"}</span>
            </h2>
            <button
              onClick={() => { setActiveTab("assessment"); setStage("questions"); setAnswers({}); setCurrentIndex(0); }}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{language === "ta" ? "புதிய மதிப்பீடு தொடங்குக" : "Take New Assessment"}</span>
            </button>
          </div>

          {loadingHistory ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="card p-10 text-center space-y-4">
              <div className="mx-auto w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Brain className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {language === "ta" ? "முந்தைய மதிப்பீடுகள் எதுவும் இல்லை" : "No previous assessments found"}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                {language === "ta"
                  ? "உங்கள் முதல் மதிப்பீட்டைத் தொடங்கி உங்கள் மனநிலை சுய விவரக்குறிப்பைப் பெறுங்கள்."
                  : "Complete your first 40-question assessment to generate your personalized mindset profile and track your growth over time."}
              </p>
              <button
                onClick={() => { setActiveTab("assessment"); setStage("questions"); }}
                className="btn-primary text-xs"
              >
                {language === "ta" ? "இப்போதே மதிப்பீட்டைத் தொடங்கு" : "Start Assessment Now"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item, idx) => {
                const isLatest = idx === 0;
                return (
                  <div
                    key={item._id || idx}
                    className="card p-5 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-base text-slate-900 dark:text-white">
                          {item.mindsetProfile || "Well-Being Assessment"}
                        </span>
                        {isLatest && (
                          <span className="badge bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                            Latest
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-2">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(item.completedAt || item.createdAt || Date.now()).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                      </p>
                      {item.summary && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-1 max-w-xl">
                          {item.summary}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Score</span>
                        <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                          {item.overallPercentage}%
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setResult(item);
                          setActiveTab("assessment");
                          setStage("result");
                        }}
                        className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-200 transition-all flex items-center gap-1"
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
              <div className="card p-6 sm:p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {language === "ta" ? "மதிப்பீட்டின் நோக்கம்" : "Purpose of This Assessment"}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {language === "ta"
                      ? "இந்த மதிப்பீடு உங்கள் தற்போதைய உணர்ச்சி நல்வாழ்வு, கல்வி அழுத்தம், சுயநம்பிக்கை மற்றும் சவால்களை சமாளிக்கும் திறனை ஆழமாக பகுப்பாய்வு செய்து தனிப்பயனாக்கப்பட்ட வளர்ச்சி வழிகாட்டுதல்களை வழங்குகிறது."
                      : "This confidential self-assessment evaluates 5 fundamental domains of student psychological health and mindset. It takes approximately 4–6 minutes to answer 40 reflective questions."}
                  </p>
                </div>

                {/* 5 Domains Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.values(CATEGORIES).map((cat) => (
                    <div
                      key={cat.id}
                      className="p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-1.5"
                    >
                      <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400 block">
                        {language === "ta" ? cat.tamilTitle : cat.title}
                      </span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {cat.description}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Safety & Medical Disclaimer Alert */}
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 text-amber-900 dark:text-amber-200 text-xs leading-relaxed flex items-start gap-3 shadow-sm">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-0.5">⚠️ Important Safety & Ethical Notice:</span>
                    <span>{ASSESSMENT_DISCLAIMER}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="text-xs text-slate-400 font-medium">
                    <span>40 Questions · 5-Point Response Scale · Confidential</span>
                  </div>

                  <button
                    onClick={() => {
                      setAnswers({});
                      setCurrentIndex(0);
                      setStage("questions");
                    }}
                    className="btn-primary text-sm px-6 py-3 shadow-lg shadow-indigo-500/20 flex items-center gap-2"
                  >
                    <span>{language === "ta" ? "மதிப்பீட்டைத் தொடங்குக" : "Begin Assessment"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. QUESTIONS STEPPER STAGE */}
          {stage === "questions" && (
            <div className="space-y-6">
              {/* Stepper Header */}
              <div className="card p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs">
                      {language === "ta" ? currentCat.tamilTitle : currentCat.title}
                    </span>
                    <span className="text-slate-400 font-medium hidden sm:inline">
                      (Q{currentCat.questions[0]}–Q{currentCat.questions[currentCat.questions.length - 1]})
                    </span>
                  </div>

                  <span className="font-extrabold text-slate-700 dark:text-slate-300">
                    Question {currentIndex + 1} of {ASSESSMENT_QUESTIONS.length}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 transition-all duration-300"
                    style={{ width: `${((currentIndex + 1) / ASSESSMENT_QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div className="card p-6 sm:p-8 space-y-6 shadow-md">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Question #{currentQ.id}
                  </span>
                  <h3 className="text-lg sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-snug">
                    {currentQ.text}
                  </h3>
                </div>

                {/* 5 Response Scale Buttons */}
                <div className="space-y-2.5">
                  {RESPONSE_SCALE.map((opt) => {
                    const isSelected = answers[`q${currentQ.id}`] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleSelectOption(opt.value)}
                        className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                          isSelected
                            ? "bg-indigo-50 dark:bg-indigo-950/70 border-indigo-600 shadow-md ring-2 ring-indigo-500/30 scale-[1.01]"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs transition-colors ${
                              isSelected
                                ? "bg-indigo-600 text-white"
                                : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {opt.value}
                          </div>
                          <div>
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                              {language === "ta" ? opt.tamilLabel : opt.label}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              {opt.description}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Controls */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs text-slate-400 font-bold">
                    {answeredCount}/40 answered
                  </span>

                  {currentIndex < ASSESSMENT_QUESTIONS.length - 1 ? (
                    <button
                      onClick={handleNext}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/20"
                    >
                      <span>Next</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setStage("confirm")}
                      disabled={!isAllAnswered}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all flex items-center gap-1.5 shadow-md shadow-emerald-500/20 disabled:opacity-50"
                    >
                      <span>Review & Submit</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Jump to Question Matrix */}
              <div className="card p-4 space-y-3">
                <span className="text-xs font-bold text-slate-500 block">Jump to Question:</span>
                <div className="grid grid-cols-10 sm:grid-cols-20 gap-1.5">
                  {ASSESSMENT_QUESTIONS.map((q, idx) => {
                    const isAnswered = answers[`q${q.id}`] !== undefined;
                    const isCurrent = currentIndex === idx;
                    return (
                      <button
                        key={q.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${
                          isCurrent
                            ? "bg-indigo-600 text-white ring-2 ring-indigo-400 scale-110"
                            : isAnswered
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200"
                        }`}
                      >
                        {q.id}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. CONFIRMATION STAGE */}
          {stage === "confirm" && (
            <div className="card p-6 sm:p-8 space-y-6 max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                  {language === "ta" ? "மதிப்பீட்டை சமர்ப்பிக்க உறுதிப்படுத்துக" : "Ready to Evaluate Your Assessment?"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  {language === "ta"
                    ? "அனைத்து 40 கேள்விகளுக்கும் வெற்றிகரமாக பதிலளித்துள்ளீர்கள். உங்கள் பதில்கள் பாதுகாப்பாக சேமிக்கப்பட்டு நல்வாழ்வு அறிக்கை உருவாக்கப்படும்."
                    : "You have answered all 40 questions. Our backend analysis engine will calculate your category scores, mindset profile, and recommendations."}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-500 space-y-1">
                <p>✓ 40 / 40 Questions Answered</p>
                <p>✓ Mathematical reverse-scoring validation</p>
                <p>✓ 100% Private to your student account</p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setStage("questions")}
                  className="btn-outline text-xs px-5 py-2.5"
                >
                  Review Answers
                </button>
                <button
                  onClick={handleSubmitAssessment}
                  disabled={submitting}
                  className="btn-primary text-xs px-6 py-2.5 flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                >
                  {submitting ? (
                    <span>Evaluating Assessment...</span>
                  ) : (
                    <>
                      <span>Generate My Results ✨</span>
                      <Sparkles className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* 4. RESULTS DASHBOARD STAGE */}
          {stage === "result" && result && (
            <div className="space-y-6 animate-fade-in">
              {/* Overall Score & Mindset Profile Card */}
              <div className="card p-6 sm:p-8 bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 text-white border border-indigo-800/40 shadow-2xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                  <div className="space-y-2 text-center md:text-left">
                    <span className="badge bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 text-xs font-extrabold px-3 py-1">
                      Mindset Profile: {result.mindsetProfile}
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                      Psychology & Mindset Results
                    </h2>
                    <p className="text-xs sm:text-sm text-indigo-100/80 max-w-xl">
                      {result.summary || "Your responses have been mathematically evaluated across the 5 core psychological domains."}
                    </p>
                  </div>

                  <div className="flex flex-col items-center justify-center p-5 rounded-3xl bg-slate-900/80 border border-indigo-500/30 backdrop-blur-md shadow-inner flex-shrink-0 w-44">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Well-Being</span>
                    <span className="text-4xl sm:text-5xl font-black text-emerald-400 my-1">
                      {result.overallPercentage}%
                    </span>
                    <span className="text-[10px] text-slate-400 font-semibold">
                      Raw: {result.overallScore} / 200
                    </span>
                  </div>
                </div>
              </div>

              {/* 5 Category Score Cards Grid */}
              <div className="space-y-3">
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-indigo-600" />
                  <span>Category Breakdown & Well-Being Indicators</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(result.categoryScores || {}).map(([key, cat]) => {
                    const meta = CATEGORIES[key as keyof typeof CATEGORIES];
                    if (!meta) return null;
                    const badgeClasses = getLevelBadgeClass(cat.level);
                    const barColor = getScoreBarColor(cat.percentage);

                    return (
                      <div
                        key={key}
                        className="card p-5 space-y-3 flex flex-col justify-between hover:shadow-lg transition-all"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {language === "ta" ? meta.tamilTitle : meta.title}
                            </span>
                            <span className="text-base font-black text-slate-900 dark:text-white">
                              {cat.percentage}%
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                            {meta.description}
                          </p>
                        </div>

                        <div className="space-y-2 pt-2">
                          {/* Progress Bar */}
                          <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                            <div
                              className={`h-full ${barColor} transition-all duration-500`}
                              style={{ width: `${cat.percentage}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeClasses.bg} ${badgeClasses.text} ${badgeClasses.border}`}
                            >
                              {cat.level}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {cat.score}/40
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Strengths & Areas to Focus On */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="card p-6 border-emerald-200/70 dark:border-emerald-900/60 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
                  <h4 className="font-extrabold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
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
                <div className="card p-6 border-amber-200/70 dark:border-amber-900/60 bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
                  <h4 className="font-extrabold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
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

              {/* Personalized Practical Recommendations */}
              <div className="card p-6 sm:p-8 space-y-4">
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Personalized Actionable Suggestions</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(result.recommendations || []).map((rec, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 flex items-start gap-2.5"
                    >
                      <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        {i + 1}
                      </div>
                      <span className="leading-relaxed">{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Steps & Support Links */}
              <div className="card p-6 space-y-4 bg-slate-50/80 dark:bg-slate-900/80">
                <h4 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
                  Recommended Next Steps
                </h4>

                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    to="/candidate/music"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white hover:border-emerald-500 transition-all"
                  >
                    <Music className="w-4 h-4 text-emerald-500" />
                    <span>Relaxing Spotify Music</span>
                  </Link>

                  <Link
                    to="/candidate/ai-chat"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white hover:border-blue-500 transition-all"
                  >
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    <span>Talk with Mira AI Assistant</span>
                  </Link>

                  <Link
                    to="/candidate/counselors"
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white hover:border-teal-500 transition-all"
                  >
                    <UserCheck className="w-4 h-4 text-teal-500" />
                    <span>Book a Counselor Session</span>
                  </Link>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-200/60 dark:border-slate-800 text-xs text-slate-400">
                  <span>Completed on {new Date(result.completedAt || result.createdAt || Date.now()).toLocaleString()}</span>
                  <button
                    onClick={handleRetake}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1"
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
    </div>
  );
}
