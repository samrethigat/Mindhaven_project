import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Sparkles, 
  Heart, 
  Shield, 
  Brain, 
  UserCheck, 
  Calendar, 
  MessageSquare, 
  PhoneCall, 
  AlertCircle, 
  ArrowRight, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCcw, 
  Star, 
  Clock, 
  MapPin, 
  ChevronRight,
  Activity,
  Smile,
  Zap,
  HelpCircle
} from "lucide-react";

const features = [
  {
    icon: <Sparkles className="w-7 h-7 text-blue-500" />,
    title: "AI Companion Mira",
    body: "An empathetic companion trained for student support. Listens 24/7, offers CBT-based grounding, and knows when to escalate.",
    badge: "Always Online"
  },
  {
    icon: <Brain className="w-7 h-7 text-indigo-500" />,
    title: "Validated Assessments",
    body: "Clinically backed mental health screenings (GAD-7, PHQ-9 style) to track anxiety, stress, depression, and personal wellness trends.",
    badge: "Clinical Accuracy"
  },
  {
    icon: <UserCheck className="w-7 h-7 text-teal-500" />,
    title: "Licensed Counselors",
    body: "Explore verified campus psychologists and clinical counselors. Book private sessions via video, voice call, or in-person.",
    badge: "Verified Experts"
  },
  {
    icon: <Calendar className="w-7 h-7 text-sky-500" />,
    title: "Smart Scheduling",
    body: "Real-time calendar availability, instant confirmation notifications, calendar syncing, and automated 24h reminders.",
    badge: "Zero Conflict"
  },
  {
    icon: <MessageSquare className="w-7 h-7 text-emerald-500" />,
    title: "Encrypted Live Chat",
    body: "Private real-time messaging with your assigned counselor with file sharing, voice notes, and continuous care history.",
    badge: "End-to-End Private"
  },
  {
    icon: <AlertCircle className="w-7 h-7 text-rose-500" />,
    title: "Emergency Crisis Hub",
    body: "Automated high-risk distress detection escalates critical cases directly to designated emergency contacts and campus counselors.",
    badge: "24/7 Safety Net"
  },
];

const careTiers = [
  {
    level: "Tier 1",
    name: "Mild Stress & Mood Dips",
    tagline: "Preventive Care & Daily Grounding",
    color: "from-blue-500 to-cyan-500",
    border: "border-blue-200",
    bg: "bg-blue-50/50",
    text: "text-blue-600",
    features: [
      "24/7 interactive chat with Mira AI companion",
      "Guided 4-7-8 & box breathing relaxation tools",
      "Mood check-in streaks & emotional journal",
      "Curated focus playlists & motivational insights"
    ]
  },
  {
    level: "Tier 2",
    name: "Moderate Anxiety & Burnout",
    tagline: "Clinical Support & Counselor Matching",
    color: "from-indigo-500 to-purple-500",
    border: "border-indigo-200",
    bg: "bg-indigo-50/50",
    text: "text-indigo-600",
    features: [
      "Voice check-in sessions with AI assistant",
      "Comprehensive multi-dimensional wellness screening",
      "1-click booking with verified campus psychologists",
      "Secure video telemedicine consultation room"
    ]
  },
  {
    level: "Tier 3",
    name: "High Distress & Crisis SOS",
    tagline: "Rapid Escalation & Safety Protocol",
    color: "from-rose-500 to-red-600",
    border: "border-rose-200",
    bg: "bg-rose-50/50",
    text: "text-rose-600",
    features: [
      "Real-time distress trigger detection from assessments",
      "Instant automated alerts to registered trusted contacts",
      "Priority dispatch to emergency campus counselors",
      "Direct 1-touch national crisis helpline speed-dial"
    ]
  }
];

const sampleCounselors = [
  {
    name: "Dr. Meera Nair, Ph.D.",
    title: "Licensed Clinical Psychologist",
    specialty: "Anxiety, Academic Burnout & CBT",
    experience: "11+ yrs experience",
    rating: "4.9",
    reviews: "142 sessions",
    availability: "Available Today",
    avatar: "👩‍⚕️"
  },
  {
    name: "Dr. Arjun Patel, M.D.",
    title: "Psychiatrist & Student Counselor",
    specialty: "Depression, Sleep & Stress Management",
    experience: "9+ yrs experience",
    rating: "4.95",
    reviews: "198 sessions",
    availability: "Available Tomorrow",
    avatar: "👨‍⚕️"
  },
  {
    name: "Dr. Sarah Jenkins, Psy.D.",
    title: "Counseling Psychologist",
    specialty: "Mindfulness, Trauma & Relationships",
    experience: "7+ yrs experience",
    rating: "4.88",
    reviews: "116 sessions",
    availability: "Available Today",
    avatar: "👩‍⚕️"
  }
];

const faqs = [
  {
    q: "Is my personal data and consultation strictly confidential?",
    a: "Yes. MINDHAVEN enforces strict role-based access control and encrypted data storage. Your self-assessments and chat transcripts remain strictly private between you and your verified counselor."
  },
  {
    q: "How does the AI Companion Mira work?",
    a: "Mira is an empathetic wellness assistant designed for active listening, guided mindfulness, and supportive motivation. If Mira detects high distress keywords, she guides you directly to professional counselor booking and emergency resources."
  },
  {
    q: "Can I use MINDHAVEN on my mobile phone?",
    a: "MINDHAVEN is fully responsive for smartphones, tablets, and desktops. You can access all features including video consultation and real-time chat directly from any browser without installing an app."
  },
  {
    q: "How do I join as a campus counselor or doctor?",
    a: "Counselors can register through the Counselor Portal with their medical license/registration ID, clinic details, and specializations. Once verified, you can manage appointments and consultation rooms."
  }
];

export function Landing() {
  const [activeTab, setActiveTab] = useState(0);
  
  // Interactive Mira preview state
  const [miraMessages, setMiraMessages] = useState([
    { sender: "mira", text: "Hi there! I'm Mira, your MindHaven companion. How are you feeling today?" }
  ]);
  const [isMiraTyping, setIsMiraTyping] = useState(false);

  const handleQuickPrompt = (promptText: string, replyText: string) => {
    setMiraMessages((prev) => [...prev, { sender: "user", text: promptText }]);
    setIsMiraTyping(true);
    setTimeout(() => {
      setMiraMessages((prev) => [...prev, { sender: "mira", text: replyText }]);
      setIsMiraTyping(false);
    }, 900);
  };

  // Interactive Breathing Exercise State
  const [isBreathingActive, setIsBreathingActive] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale">("Inhale");
  const [breathTimer, setBreathTimer] = useState(4);

  useEffect(() => {
    let interval: any = null;
    if (isBreathingActive) {
      interval = setInterval(() => {
        setBreathTimer((prev) => {
          if (prev <= 1) {
            setBreathPhase((currentPhase) => {
              if (currentPhase === "Inhale") return "Hold";
              if (currentPhase === "Hold") return "Exhale";
              return "Inhale";
            });
            return 4;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      setBreathPhase("Inhale");
      setBreathTimer(4);
    }
    return () => clearInterval(interval);
  }, [isBreathingActive]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 text-xl font-extrabold tracking-tight text-slate-900 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Brain className="h-5 w-5" />
            </div>
            <span className="font-display tracking-wider text-lg font-black bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-600 bg-clip-text text-transparent">
              MINDHAVEN
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-slate-600 lg:flex">
            <a href="#features" className="hover:text-blue-600 transition-colors">Features</a>
            <a href="#levels" className="hover:text-blue-600 transition-colors">Care Levels</a>
            <a href="#breathing" className="hover:text-blue-600 transition-colors">Relaxation Tool</a>
            <a href="#counselors" className="hover:text-blue-600 transition-colors">Counselors</a>
            <a href="#emergency" className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4" /> Crisis Support
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link 
              to="/login/parent" 
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all"
            >
              Parent Portal
            </Link>
            <Link 
              to="/login/counselor" 
              className="btn-outline text-xs sm:text-sm px-3 py-1.5 hover:border-indigo-300"
            >
              Counselor Portal
            </Link>
            <Link 
              to="/login/candidate" 
              className="btn-primary text-xs sm:text-sm px-3.5 py-1.5 shadow-blue-500/25"
            >
              Candidate Portal
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-600 via-indigo-700 to-slate-900 pt-16 pb-24 text-white sm:pt-20 sm:pb-32">
        {/* Background glow meshes */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-40 h-96 w-96 rounded-full bg-indigo-400/20 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            
            {/* Hero Left Content */}
            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-blue-300 animate-pulse" />
                <span>Next-Gen Student Mental Health Ecosystem</span>
              </div>

              <h1 className="mt-6 text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl font-display leading-[1.12]">
                Someone in your corner, <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-blue-200 via-sky-200 to-white bg-clip-text text-transparent">
                  every single day.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base text-blue-100/90 sm:text-lg leading-relaxed">
                A unified mental health platform tailored for higher education. Combining 24/7 AI companion check-ins, clinically validated self-assessments, licensed counselor bookings, and automated crisis safety nets.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/register/candidate"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-blue-700 shadow-xl shadow-blue-900/30 transition-all hover:bg-blue-50 hover:scale-[1.02] active:scale-100"
                >
                  <span>Student Sign Up</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register/parent"
                  className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-100"
                >
                  <span>Parent Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register/counselor"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-3 text-xs sm:text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/20"
                >
                  <UserCheck className="w-4 h-4 text-sky-300" />
                  <span>Join as Counselor</span>
                </Link>
              </div>

              {/* Stats badges */}
              <div className="mt-12 grid grid-cols-3 gap-4 border-t border-white/15 pt-8">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">24 / 7</div>
                  <div className="text-xs sm:text-sm text-blue-200">AI Companion Care</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">100%</div>
                  <div className="text-xs sm:text-sm text-blue-200">Confidential & Private</div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white">0s</div>
                  <div className="text-xs sm:text-sm text-blue-200">Crisis Alert Delay</div>
                </div>
              </div>
            </div>

            {/* Hero Right Interactive AI Mockup */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl border border-white/20 bg-white/10 p-4 sm:p-6 backdrop-blur-2xl shadow-2xl">
                
                {/* Header of Preview Box */}
                <div className="flex items-center justify-between border-b border-white/15 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-400 to-blue-600 text-white shadow-md">
                      <Sparkles className="h-5 w-5" />
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-indigo-900 bg-emerald-400 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">Mira — AI Companion</h3>
                      <p className="text-xs text-blue-200">Active • 24/7 Empathetic Support</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                    Live Demo
                  </span>
                </div>

                {/* Chat Stream */}
                <div className="my-4 flex flex-col gap-3 max-h-72 overflow-y-auto pr-1">
                  {miraMessages.map((m, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {m.sender === "mira" && (
                        <div className="h-7 w-7 rounded-xl bg-blue-500/30 flex items-center justify-center text-xs shrink-0 mt-1">
                          🤖
                        </div>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed max-w-[85%] ${
                          m.sender === "user"
                            ? "bg-blue-500 text-white shadow-md"
                            : "bg-white text-slate-800 shadow-lg"
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {isMiraTyping && (
                    <div className="flex items-center gap-2 text-xs text-blue-200">
                      <div className="h-2 w-2 rounded-full bg-blue-300 animate-bounce" />
                      <div className="h-2 w-2 rounded-full bg-blue-300 animate-bounce [animation-delay:0.2s]" />
                      <div className="h-2 w-2 rounded-full bg-blue-300 animate-bounce [animation-delay:0.4s]" />
                      <span>Mira is typing…</span>
                    </div>
                  )}
                </div>

                {/* Quick Interactive Prompt Chips */}
                <div className="border-t border-white/15 pt-3">
                  <p className="text-[11px] font-semibold text-blue-200 mb-2">Try tapping a student prompt:</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      onClick={() => handleQuickPrompt(
                        "I feel overwhelmed with upcoming semester exams.",
                        "That is completely valid. Exam stress can feel heavy. Let's break it down into 20-minute focus sprints and do a quick 60s breathing cycle right now."
                      )}
                      className="rounded-lg bg-white/15 px-2.5 py-1.5 text-xs text-white hover:bg-white/25 transition-all text-left"
                    >
                      📚 "Overwhelmed with exams"
                    </button>
                    <button
                      onClick={() => handleQuickPrompt(
                        "I'm feeling down and having trouble sleeping.",
                        "I hear you. Sleep and mood are deeply connected. Would you like to try progressive muscle relaxation or see available counselor slots for tomorrow?"
                      )}
                      className="rounded-lg bg-white/15 px-2.5 py-1.5 text-xs text-white hover:bg-white/25 transition-all text-left"
                    >
                      🌙 "Trouble sleeping"
                    </button>
                    <button
                      onClick={() => handleQuickPrompt(
                        "I want to book an appointment with Dr. Meera.",
                        "Great choice! Dr. Meera has slots available today. Click 'Candidate Portal' above to schedule with 1 click."
                      )}
                      className="rounded-lg bg-white/15 px-2.5 py-1.5 text-xs text-white hover:bg-white/25 transition-all text-left"
                    >
                      📅 "Book Dr. Meera"
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3.5 py-1 text-xs font-bold text-blue-700">
            Comprehensive Platform
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
            Built from the ground up for student wellbeing
          </h2>
          <p className="mt-4 text-base text-slate-600">
            Every layer of MindHaven addresses distinct student needs — from self-guided daily mindfulness to licensed psychiatric care.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-card p-7 group hover:border-blue-300 relative flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-slate-100 group-hover:bg-blue-50 transition-colors">
                    {f.icon}
                  </div>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                    {f.badge}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {f.title}
                </h3>
                <p className="mt-2.5 text-sm text-slate-600 leading-relaxed">
                  {f.body}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-1 text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform">
                <span>Explore feature</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3-Tier Care Level Interactive Tabs */}
      <section id="levels" className="bg-white py-20 sm:py-28 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Adaptive Support Matrix
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 font-display">
              Three levels of compassionate care
            </h2>
            <p className="mt-4 text-slate-600">
              MindHaven continuously matches the intensity of care to the individual's needs.
            </p>
          </div>

          {/* Tab Selector */}
          <div className="mt-12 flex justify-center">
            <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 border border-slate-200 max-w-md w-full">
              {careTiers.map((tier, i) => (
                <button
                  key={tier.level}
                  onClick={() => setActiveTab(i)}
                  className={`flex-1 rounded-xl py-2.5 text-xs sm:text-sm font-bold transition-all ${
                    activeTab === i
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {tier.level}
                </button>
              ))}
            </div>
          </div>

          {/* Active Tab Card */}
          <div className="mt-8 max-w-4xl mx-auto">
            <div className={`rounded-3xl border ${careTiers[activeTab].border} ${careTiers[activeTab].bg} p-8 sm:p-12 transition-all shadow-lg`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-200/80">
                <div>
                  <span className={`text-xs font-extrabold uppercase tracking-wider ${careTiers[activeTab].text}`}>
                    {careTiers[activeTab].level} Care Protocol
                  </span>
                  <h3 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {careTiers[activeTab].name}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {careTiers[activeTab].tagline}
                  </p>
                </div>
                <Link
                  to="/login/candidate"
                  className="btn-primary shrink-0 self-start md:self-auto"
                >
                  <span>Access {careTiers[activeTab].level} Tools</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {careTiers[activeTab].features.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 bg-white/80 rounded-2xl p-4 border border-white">
                    <CheckCircle2 className={`w-5 h-5 ${careTiers[activeTab].text} shrink-0 mt-0.5`} />
                    <span className="text-sm font-medium text-slate-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 60-Second Breathing Relaxation Tool */}
      <section id="breathing" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-6">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-100 px-3.5 py-1 text-xs font-bold text-teal-800">
              <Heart className="w-3.5 h-3.5 text-teal-600" /> Instant Calm
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
              Take 60 seconds to reset your nervous system
            </h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Box breathing is scientifically proven to activate the parasympathetic nervous system, lowering heart rate, calming racing thoughts, and resetting cortisol levels within one minute.
            </p>

            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold text-xs">1</div>
                <p className="text-sm font-semibold text-slate-700">Inhale deeply through your nose for 4 seconds</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 font-bold text-xs">2</div>
                <p className="text-sm font-semibold text-slate-700">Hold your breath calmly for 4 seconds</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-700 font-bold text-xs">3</div>
                <p className="text-sm font-semibold text-slate-700">Exhale slowly through your mouth for 4 seconds</p>
              </div>
            </div>

            <div className="mt-8">
              <button
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className={`inline-flex items-center gap-2.5 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-lg transition-all ${
                  isBreathingActive
                    ? "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/20"
                    : "bg-gradient-to-r from-teal-600 to-emerald-600 text-white hover:from-teal-700 hover:to-emerald-700 shadow-teal-600/20"
                }`}
              >
                {isBreathingActive ? (
                  <>
                    <Pause className="w-4 h-4" /> Pause Guided Breathing
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white" /> Start 4-4-4 Breathing Exercise
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Animated Visualizer */}
          <div className="lg:col-span-6 flex justify-center">
            <div className="relative flex flex-col items-center justify-center rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-10 sm:p-14 text-white shadow-2xl w-full max-w-md aspect-square border border-indigo-500/20">
              
              {/* Outer pulsing ring */}
              <div 
                className={`absolute rounded-full bg-teal-400/20 transition-all duration-1000 ${
                  isBreathingActive && breathPhase === "Inhale"
                    ? "w-72 h-72 scale-110"
                    : isBreathingActive && breathPhase === "Hold"
                    ? "w-72 h-72 scale-105"
                    : "w-52 h-52 scale-95"
                }`}
              />

              {/* Inner core circle */}
              <div 
                className={`relative flex flex-col items-center justify-center rounded-full bg-gradient-to-tr from-teal-500 to-blue-600 shadow-2xl transition-all duration-1000 z-10 ${
                  isBreathingActive && breathPhase === "Inhale"
                    ? "w-48 h-48 scale-110 shadow-teal-400/50"
                    : isBreathingActive && breathPhase === "Hold"
                    ? "w-48 h-48 scale-105 shadow-indigo-400/50"
                    : "w-36 h-36 scale-95 shadow-blue-400/30"
                }`}
              >
                <span className="text-xs uppercase tracking-widest font-extrabold text-teal-100">
                  {isBreathingActive ? breathPhase : "Ready"}
                </span>
                <span className="text-4xl sm:text-5xl font-black font-display mt-1">
                  {isBreathingActive ? breathTimer : "4"}s
                </span>
                <span className="text-[10px] text-teal-200 mt-1">
                  {isBreathingActive ? "Follow the pulse" : "Tap Start"}
                </span>
              </div>

              <div className="mt-8 text-center text-xs text-slate-300 font-medium">
                {isBreathingActive ? "Keep shoulders relaxed and jaw unclenched." : "Guided 4-second box cycle"}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Verified Counselors Spotlight */}
      <section id="counselors" className="bg-slate-100/70 py-20 sm:py-28 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                Medical & Psychological Staff
              </span>
              <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
                Meet our licensed campus counselors
              </h2>
              <p className="mt-2 text-slate-600 max-w-xl">
                Every counselor is background-checked and specialized in student psychological health.
              </p>
            </div>
            <Link
              to="/login/candidate"
              className="btn-outline self-start sm:self-auto shrink-0"
            >
              <span>View All Counselors</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {sampleCounselors.map((c) => (
              <div
                key={c.name}
                className="card p-6 bg-white hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-3xl border border-blue-100">
                        {c.avatar}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{c.name}</h4>
                        <p className="text-xs font-medium text-slate-500">{c.title}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5 text-blue-600" />
                      <span className="font-semibold text-slate-800">{c.specialty}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{c.experience}</span>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{c.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    {c.availability}
                  </span>
                  <Link
                    to="/login/candidate"
                    className="btn-primary text-xs px-3.5 py-1.5"
                  >
                    Book Session
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Emergency Crisis Support Banner */}
      <section id="emergency" className="py-16 bg-gradient-to-r from-rose-900 via-red-800 to-rose-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-2 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-rose-500/30 px-3 py-1 text-xs font-bold text-rose-200 border border-rose-400/30">
                <AlertCircle className="w-3.5 h-3.5 text-rose-300" /> 24/7 Immediate Crisis Assistance
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold font-display">
                If you or someone you know is in distress
              </h2>
              <p className="text-sm text-rose-100 max-w-2xl">
                Immediate, free, and confidential support is available 24 hours a day, 7 days a week. You do not have to carry this alone.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="tel:14416"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-rose-800 shadow-lg hover:bg-rose-50 transition-all"
              >
                <PhoneCall className="w-4 h-4 text-rose-600" />
                <span>Tele-MANAS: 14416</span>
              </a>
              <a
                href="tel:18005990019"
                className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20 backdrop-blur-md transition-all"
              >
                <PhoneCall className="w-4 h-4 text-rose-200" />
                <span>KIRAN: 1800-599-0019</span>
              </a>
              <Link
                to="/candidate/emergency"
                className="inline-flex items-center gap-1.5 text-xs text-rose-200 hover:text-white underline underline-offset-4 px-2"
              >
                View Full Emergency Hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 sm:py-28 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            Common Questions
          </span>
          <h2 className="mt-3 text-3xl font-extrabold text-slate-900 font-display">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="mt-12 space-y-4">
          {faqs.map((faq, idx) => (
            <div key={idx} className="card p-6 bg-white">
              <h3 className="font-bold text-slate-900 text-base flex items-start gap-3">
                <HelpCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span>{faq.q}</span>
              </h3>
              <p className="mt-3 text-sm text-slate-600 pl-8 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-sm">
                🧠
              </div>
              <div>
                <span className="font-display font-extrabold text-slate-900 text-base">MINDHAVEN</span>
                <p className="text-xs text-slate-500">Student Mental Health & Psychological Support System</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-600 font-medium">
              <Link to="/login/candidate" className="hover:text-blue-600">Candidate Portal</Link>
              <Link to="/login/counselor" className="hover:text-blue-600">Counselor Portal</Link>
              <Link to="/register/candidate" className="hover:text-blue-600">Register</Link>
              <a href="#emergency" className="text-rose-600 hover:text-rose-700">Emergency 24/7</a>
            </div>

            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} MindHaven. Designed for student wellbeing.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

