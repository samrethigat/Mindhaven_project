import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { usePageTitle } from "../../lib/usePageTitle";
import { Loading } from "../../components/ui/Loading";

const MUSIC: Record<string, string[]> = {
  calm: [
    "🎧 Try a calm lo-fi beat — the gentle rhythm can steady your breathing.",
    "🎹 'Weightless' by Marconi Union is scientifically designed to reduce anxiety.",
    "🌊 Ocean waves or rain sounds can slowly pull you back to the present.",
    "🎶 Put on something soft and slow — let the melody carry the heaviness.",
  ],
  upbeat: [
    "🎺 Dance-worthy classics like 'Uptown Funk' can fire up your energy.",
    "🎸 Put on your favourite feel-good anthem and let it lift you.",
    "🥁 Upbeat indie or pop music can help shift your mood in minutes.",
    "🎵 Make a tiny playlist of songs that make you smile and press play.",
  ],
};

const MEMES: string[] = [
  "😹 Me trying to adult today: 'I have everything under control' (narrator: she did not).",
  "🐱 'I put my glasses on to look for my glasses' — a professional at self-care.",
  "🧠 Brain at 3am: 'Let's remember every embarrassing moment ever.' Also brain: silence. Good job.",
  "😌 Me pretending I know what I'm doing in every meeting. Oscar-worthy honestly.",
  "☕ 'I only have two moods: needing coffee and having had coffee.'",
  "🙃 When the calculator gives you a different answer than your feelings.",
];

const JOKES: string[] = [
  "Why don't scientists trust atoms? Because they make up everything! 😄",
  "I told my computer I needed a break. It said it would be right back with a 'byte'. 🖥️",
  "Why did the scarecrow win an award? Because he was outstanding in his field! 🌾",
  "Parallel lines have so much in common… it's a shame they'll never meet. 📐",
  "I'm reading a book on anti-gravity. It's impossible to put down! 📚",
  "Why do programmers prefer dark mode? Because light attracts bugs! 🐛",
];

const STORIES: string[] = [
  "🌟 J.K. Rowling was rejected by 12 publishers before Harry Potter was accepted. She kept going.",
  "🐢 Sometimes the tortoise wins not by speed but by refusing to stop. Take one small step today.",
  "🌱 Every giant oak was once a tiny seed. Feeling small right now just means you're still growing.",
  "🧗 J.K. hit rock bottom and rebuilt her life one page at a time. Your next chapter is unwritten too.",
  "💪 Thomas Edison didn't fail 1000 times; he found 1000 ways that didn't work. Progress is still progress.",
];

type Exercise = { name: string; steps: string[] };

const BREATHING: Exercise = {
  name: "4-7-8 Breathing",
  steps: [
    "Breathe in through your nose for 4 seconds…",
    "Hold your breath gently for 7 seconds…",
    "Breathe out slowly through your mouth for 8 seconds…",
    "Repeat 3–4 times and feel your body settle.",
  ],
};

const MEDITATION: Exercise = {
  name: "1-Minute Mindfulness",
  steps: [
    "Find a comfortable seat and close your eyes (or soften your gaze).",
    "Take three slow, even breaths.",
    "Notice 3 sounds around you, then 2 things you can feel, then 1 thing you can see.",
    "Finish with a small smile. Well done. 💙",
  ],
};

const L2_RESPONSES = [
  "I'm really glad you told me that. It sounds like things have been heavy lately. What's been weighing on you the most?",
  "Thank you for trusting me with this. I'm here, I'm listening. Do you want to tell me a little more?",
  "That sounds really hard. I'm here with you. Is there a specific moment today that felt the heaviest?",
  "I hear you, and what you're feeling makes sense. How long have you been carrying this?",
  "You don't have to have the right words. Just sharing a little helps. What happened next?",
  "I'm so sorry you're going through this. It's okay to not be okay. What do you need most right now?",
  "You've been incredibly brave to share this. Let's take it one small breath at a time together.",
];

const L2_CLOSERS = [
  "I'm here for you, and I care. I'm not a doctor, so I'd love to help you talk to a real counselor nearby — would that be okay?",
  "You matter, and you don't have to face this alone. Would it help if I found a counselor close to you?",
  "Thank you for talking with me. A professional counselor can walk with you through this. Shall I show you who's available nearby?",
];

const L2_OPENERS = [
  "Hi, I'm Mira. Thanks for letting me talk with you. I'm here to listen, no judgement. How are you feeling right now?",
  "Hey, it's Mira. I noticed things feel heavy today. I'm really glad you're here. Tell me, what's on your mind?",
  "Hello, I'm Mira, your friend. Take a slow breath with me. Whenever you're ready, I'm here to listen.",
];

type Level = "none" | "level_1" | "level_2" | "level_3";

const WELCOME_LINES = [
  "Hey, it's Mira 💙. I'm glad you're here. How are you feeling right now?",
  "Hi! I'm Mira, your companion. Tell me what's on your mind — no judgement here.",
];

const EMPATHETIC_RESPONSES = [
  "That sounds really hard. Thank you for sharing it with me. You're not alone in this.",
  "I hear you. It's completely okay to feel this way. I'm right here with you.",
  "Thank you for trusting me with that. Let's take it one small breath at a time.",
  "What you're feeling makes sense — and it matters. I'm listening.",
  "I'm really glad you told me. I care about how you're doing.",
];

const LEVEL2_TRIGGERS = ["hopeless", "worthless", "empty", "numb", "give up", "overwhelmed", "trapped", "so sad", "very sad", "depressed", "alone", "anxious", "panic", "desperate", "exhausted", "burnout"];

const CONTEXT_PROMPTS = [
  "Could you tell me a little more about what's been going on?",
  "When did you start feeling this way?",
  "What's been weighing on you the most today?",
];

const ACTIVITIES = [
  { key: "music", label: "Music", icon: "🎵" },
  { key: "meme", label: "Meme", icon: "😹" },
  { key: "joke", label: "Joke", icon: "🤣" },
  { key: "story", label: "Motivational Story", icon: "📖" },
  { key: "breathing", label: "Breathing", icon: "🌬️" },
  { key: "meditation", label: "Meditation", icon: "🧘" },
] as const;

export function Companion() {
  usePageTitle("Mira AI Companion");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [checkInText, setCheckInText] = useState("");
  const [detectedLevel, setDetectedLevel] = useState<Level>("none");
  const [stage, setStage] = useState<"intro" | "checkin" | "results">("intro");
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  const [lastActivityContent, setLastActivityContent] = useState("");
  const [showMoodAsk, setShowMoodAsk] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  const [voiceActive, setVoiceActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceLog, setVoiceLog] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);
  const moodIndexRef = useRef(0);
  const chosenMood = useRef<"calm" | "upbeat">("calm");

  const [nearby, setNearby] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  const [chatActive, setChatActive] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "mira"; text: string }[]>([]);
  const [chatThinking, setChatThinking] = useState(false);
  const chatTurn = useRef(0);

  useEffect(() => {
    api
      .get("/care/history")
      .then((res) => setHistory(res.data.history || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function pickRotation(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!checkInText.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/care/checkin", { text: checkInText });
      const level = res.data.level as Level;
      setDetectedLevel(level);
      chosenMood.current = checkInText.toLowerCase().match(/angry|tired|exhausted|heavy/) ? "calm" : "upbeat";

      if (level === "level_3") {
        setStage("results");
        toast.error("I'm worried about you. Please reach out to a counselor right away, or your local emergency hotline.");
      } else if (level === "level_2") {
        setStage("results");
        setVoiceLog([L2_OPENERS[Math.floor(Math.random() * L2_OPENERS.length)]]);
      } else if (level === "level_1") {
        setStage("results");
        setMiraHello();
      } else {
        setStage("results");
        toast.success("Glad you're doing okay! Mira is here whenever you need. 💙");
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function setMiraHello() {
    setVoiceLog([
      pickRotation([
        "I'm here with you. Let's find something to lift your mood. What sounds good?",
        "Thanks for sharing. Let's try something that might make today a little lighter.",
        "You're not alone today. Pick an activity below and let's do it together.",
      ]),
    ]);
  }

  async function runActivity(key: string) {
    try {
      await api.post("/care/activity", { activity: key });
    } catch {}

    let content = "";
    if (key === "music") content = pickRotation(MUSIC[chosenMood.current]);
    else if (key === "meme") content = pickRotation(MEMES);
    else if (key === "joke") content = pickRotation(JOKES);
    else if (key === "story") content = pickRotation(STORIES);
    else if (key === "breathing") content = `${BREATHING.name}\n• ${BREATHING.steps.join("\n• ")}`;
    else if (key === "meditation") content = `${MEDITATION.name}\n• ${MEDITATION.steps.join("\n• ")}`;

    setActiveActivity(key);
    setLastActivityContent(content);
    setShowMoodAsk(true);
  }

  async function handleMoodAnswer(improved: boolean) {
    try {
      await api.post("/care/mood", { moodImproved: improved });
    } catch {}

    setShowMoodAsk(false);
    const msg = improved
      ? "That's wonderful! I'm so glad it helped. Remember, small steps count. 💙"
      : "That's completely okay. You were brave to try. Let me know if you want to talk or try another exercise. 💙";
    setVoiceLog((v) => [...v, msg]);
  }

  function getRecognition() {
    const w = window as any;
    return w.SpeechRecognition || w.webkitSpeechRecognition;
  }

  function speak(text: string) {
    const w = window as any;
    if (!w.speechSynthesis) return;
    w.speechSynthesis.cancel();
    const u = new w.SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 1;
    u.pitch = 1.05;
    u.onstart = () => setSpeaking(true);
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    w.speechSynthesis.speak(u);
  }

  function stopSpeech() {
    const w = window as any;
    if (w.speechSynthesis) w.speechSynthesis.cancel();
    setSpeaking(false);
  }

  function startVoice() {
    const SR = getRecognition();
    if (!SR || !(window as any).speechSynthesis) {
      toast.error("Voice isn't supported in this browser. Please use Chrome or Edge.");
      return;
    }
    setVoiceActive(true);
    setListening(true);

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.trim();
      respondToVoice(transcript);
    };
    rec.onerror = () => {
      setListening(false);
      speak("I couldn't hear you clearly. Tap the microphone to try again.");
    };
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();

    const opener = L2_OPENERS[Math.floor(Math.random() * L2_OPENERS.length)];
    setVoiceLog((v) => [...v, opener]);
    speak(opener);
  }

  function respondToVoice(transcript: string) {
    const log = (m: string) => setVoiceLog((v) => [...v, `You: ${transcript}`, `Mira: ${m}`]);
    const lower = transcript.toLowerCase();

    if (lower.match(/suicid|kill myself|end my life|hurt myself|harm myself|want to die/)) {
      const urgent =
        "I'm very concerned about you, and you don't have to go through this alone. Please reach out to a counselor right now, or call an emergency line immediately. Let me show you counselors nearby.";
      log(urgent);
      speak(urgent);
      loadNearby();
      return;
    }

    if (lower.match(/yes|okay|sure|fine|ok/)) {
      const r = pickRotation(L2_CLOSERS);
      log(r);
      speak(r);
      loadNearby();
      return;
    }

    if (lower.match(/counselor|book|doctor|professional|help me/)) {
      loadNearby();
      const r = "Of course. I've found some caring counselors nearby — you can book an appointment right on screen.";
      log(r);
      speak(r);
      return;
    }

    const resp = L2_RESPONSES[moodIndexRef.current % L2_RESPONSES.length];
    moodIndexRef.current += 1;
    log(resp);
    speak(resp);
  }

  function listenAgain() {
    const SR = getRecognition();
    if (!SR || !recognitionRef.current) {
      startVoice();
      return;
    }
    setListening(true);
    const rec = recognitionRef.current;
    try {
      rec.stop();
    } catch {}
    setTimeout(() => {
      try {
        rec.start();
      } catch {
        startVoice();
      }
    }, 150);
  }

  function stopVoice() {
    stopSpeech();
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setVoiceActive(false);
    setListening(false);
  }

  async function loadNearby() {
    setLoadingNearby(true);
    try {
      const city = user?.city || user?.district || "";
      const state = user?.state || "";
      const res = await api.get("/care/counselors", { params: { city, state } });
      setNearby(res.data.counselors || []);
    } catch {
      setNearby([]);
      toast.error("Couldn't load counselors right now.");
    } finally {
      setLoadingNearby(false);
    }
  }

  function startChat() {
    setChatActive(true);
    setMessages([{ role: "mira", text: pickRotation(WELCOME_LINES) }]);
    chatTurn.current = 0;
  }

  async function sendChat(e: React.FormEvent) {
    e.preventDefault();
    const content = chatMsg.trim();
    if (!content || chatThinking) return;
    const userMsg = { role: "user" as const, text: content };
    setMessages((prev) => [...prev, userMsg]);
    setChatMsg("");
    setChatThinking(true);
    setDetectedLevel("none");

    try {
      const res = await api.post("/care/checkin", { text: content });
      const level = res.data.level as Level;
      const lower = content.toLowerCase();

      let reply = "";

      if (level === "level_3" || /suicid|kill myself|end my life|hurt myself|harm myself|want to die|better off dead|end it all/.test(lower)) {
        setDetectedLevel("level_3");
        reply = "I'm very worried about you, and you don't have to go through this alone. Please reach out to a licensed counselor right now, or your local emergency helpline. I will show you nearby counselors.";
        loadNearby();
      } else if (level === "level_2" || LEVEL2_TRIGGERS.some((w) => lower.includes(w))) {
        setDetectedLevel("level_2");
        reply = pickRotation([
          "I'm really glad you told me. This sounds heavy. Would you like me to find a licensed counselor near you, or talk it through for a little while?",
          "Thank you for trusting me. You don't have to carry this alone. Would it help to start a voice conversation with me?",
        ]);
        loadNearby();
      } else if (/counselor|book|doctor|professional|help/.test(lower)) {
        setDetectedLevel("level_2");
        loadNearby();
        reply = "Of course. I've found caring counselors nearby for you.";
      } else {
        reply = pickRotation([...CONTEXT_PROMPTS, ...EMPATHETIC_RESPONSES]);
      }

      chatTurn.current += 1;
      setMessages((prev) => [...prev, { role: "mira", text: reply }]);
    } catch {
      setMessages((prev) => [...prev, { role: "mira", text: "I'm here with you. Tell me a little more. 💙" }]);
    } finally {
      setChatThinking(false);
    }
  }

  if (loading && history.length === 0 && stage === "intro") {
    return <Loading />;
  }

  const recent = history.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Mira AI Companion 🤖</h2>
        <p className="text-sm text-slate-500">Confidential AI check-in, mood guidance, and wellness activities</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">🤖 Chat with Mira</h3>
          {!chatActive ? (
            <button onClick={startChat} className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs">Start Conversation</button>
          ) : (
            <button onClick={() => setChatActive(false)} className="btn-outline text-xs">Close Chat</button>
          )}
        </div>
        {chatActive && (
          <div className="mt-4 space-y-3">
            <div className="max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${m.role === "user" ? "bg-teal-600 text-white" : "bg-white text-slate-800 border border-slate-200"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatThinking && (
                <div className="flex justify-start">
                  <span className="rounded-2xl bg-white px-3 py-2 text-xs text-slate-400">Mira is thinking…</span>
                </div>
              )}
            </div>

            {detectedLevel === "level_2" && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-xs text-amber-800 space-y-2">
                <p className="font-semibold">Professional Support Encouraged</p>
                <p>Mira is an AI companion for emotional check-ins, not a medical provider. Let's connect you with a licensed counselor.</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link to="/candidate/counselors" className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs">📅 View Nearby Counselors</Link>
                  <button onClick={startVoice} className="btn-outline text-xs">🎙️ Voice Check-in</button>
                </div>
              </div>
            )}

            {detectedLevel === "level_3" && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 space-y-2">
                <p className="font-bold text-sm">Urgent Support Notice</p>
                <p>If you are experiencing severe distress or crisis, please connect with human professional help immediately.</p>
                <Link to="/candidate/emergency" className="btn-danger text-xs inline-block">🚨 Emergency Contacts & Helplines</Link>
              </div>
            )}

            <form onSubmit={sendChat} className="flex gap-2">
              <input className="input flex-1 text-sm" placeholder="Message Mira…" value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} disabled={chatThinking} />
              <button type="submit" className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs" disabled={chatThinking}>Send</button>
            </form>
          </div>
        )}
      </div>

      {/* Level 1 & Level 2 Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="card p-6">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-600">Wellness Activities</span>
          <h3 className="mt-1 text-lg font-bold text-slate-900">Mood-Lifting Exercises</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Breathing, meditation, music, jokes, and motivational stories.</p>
          
          <div className="grid grid-cols-2 gap-2">
            {ACTIVITIES.map((a) => (
              <button key={a.key} onClick={() => runActivity(a.key)} className="rounded-xl border border-slate-200 p-3 text-left hover:bg-teal-50 transition-colors">
                <span className="text-xl">{a.icon}</span>
                <p className="mt-1 text-xs font-bold text-slate-800">{a.label}</p>
              </button>
            ))}
          </div>

          {activeActivity && (
            <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50/50 p-4 text-xs space-y-3">
              <p className="font-bold text-teal-900">{ACTIVITIES.find((a) => a.key === activeActivity)?.label}</p>
              <p className="whitespace-pre-line text-slate-700">{lastActivityContent}</p>
              {showMoodAsk && (
                <div className="pt-2 border-t border-teal-100 flex items-center justify-between">
                  <span className="font-medium text-slate-700">Did this help?</span>
                  <div className="flex gap-1">
                    <button onClick={() => handleMoodAnswer(true)} className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-[11px] py-1 px-2">Yes 💙</button>
                    <button onClick={() => handleMoodAnswer(false)} className="btn-outline text-[11px] py-1 px-2">Not yet</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="card p-6">
          <span className="text-xs font-bold uppercase tracking-widest text-teal-600">Voice Session</span>
          <h3 className="mt-1 text-lg font-bold text-slate-900">Interactive Voice Check-in</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">Speak with Mira using browser Speech Recognition & Synthesis.</p>

          {!voiceActive ? (
            <button onClick={startVoice} className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs w-full py-3">
              🎙️ Start Voice Conversation
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className={`badge ${listening ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                  {listening ? "🎤 Listening…" : "Idle"}
                </span>
                <span className={`badge ${speaking ? "bg-teal-100 text-teal-700" : "bg-slate-100 text-slate-600"}`}>
                  {speaking ? "🔊 Mira Speaking…" : "Muted"}
                </span>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-xl border border-slate-100 bg-slate-50 p-3 text-xs">
                {voiceLog.map((line, i) => (
                  <p key={i} className="text-slate-700">{line}</p>
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={listenAgain} disabled={listening} className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs flex-1">
                  🎙️ Speak
                </button>
                <button onClick={stopVoice} className="btn-outline text-xs">End Voice</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {(nearby.length > 0 || loadingNearby) && (
        <div className="card p-6 border-teal-200">
          <h3 className="font-bold text-slate-900 text-base mb-3">Recommended Nearby Counselors</h3>
          {loadingNearby ? (
            <p className="text-xs text-slate-400">Loading counselors…</p>
          ) : (
            <div className="space-y-3">
              {nearby.map((c) => (
                <div key={c._id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                  <div>
                    <p className="font-bold text-slate-900">{c.fullName}</p>
                    <p className="text-xs text-slate-500">{c.specialization} · {c.experience} yrs exp</p>
                  </div>
                  <Link to={`/candidate/book/${c._id}`} className="btn-primary bg-teal-600 hover:bg-teal-700 border-none text-xs">
                    📅 Book Appointment
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
