import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { api, getErrorMessage } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { usePageTitle } from "../../lib/usePageTitle";
import { Loading } from "../../components/ui/Loading";

/* ------------------------------------------------------------------ */
/* Dynamic, rotating mood-lifting content for Level 1                   */
/* ------------------------------------------------------------------ */
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
  "🌟 JK Rowling was rejected by 12 publishers before Harry Potter was accepted. She kept going.",
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

/* Supportive, empathetic responses for Level 2 voice/text conversation */
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

/* Level 2 opening lines from Mira (spoken via TTS) */
const L2_OPENERS = [
  "Hi, I'm Mira. Thanks for letting me talk with you. I'm here to listen, no judgement. How are you feeling right now?",
  "Hey, it's Mira. I noticed things feel heavy today. I'm really glad you're here. Tell me, what's on your mind?",
  "Hello, I'm Mira, your friend. Take a slow breath with me. Whenever you're ready, I'm here to listen.",
];

/* ------------------------------------------------------------------ */

type Level = "none" | "level_1" | "level_2" | "level_3";

/* Context-aware, non-generic conversation responses for the AI companion.
   These are empathetic/supportive and never diagnose. */
const WELCOME_LINES = [
  "Hey, it's Mira 💙. I'm glad you're here. How are you feeling right now?",
  "Hi! I'm Mira, your friend. Tell me what's on your mind — no judgement here.",
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
  usePageTitle("AI Friend");
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [checkInText, setCheckInText] = useState("");
  const [detectedLevel, setDetectedLevel] = useState<Level>("none");
  const [stage, setStage] = useState<"intro" | "checkin" | "results">("intro");
  const [activeActivity, setActiveActivity] = useState<string | null>(null);
  const [lastActivityContent, setLastActivityContent] = useState("");
  const [showMoodAsk, setShowMoodAsk] = useState(false);
  const [history, setHistory] = useState<any[]>([]);

  // Level 2 voice state
  const [voiceActive, setVoiceActive] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceLog, setVoiceLog] = useState<string[]>([]);
  const recognitionRef = useRef<any>(null);
  const moodIndexRef = useRef(0);
  const chosenMood = useRef<"calm" | "upbeat">("calm");

  // Counselors for booking
  const [nearby, setNearby] = useState<any[]>([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // AI friend conversation (context-aware)
  const [chatActive, setChatActive] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "mira"; text: string }[]>([]);
  const [chatThinking, setChatThinking] = useState(false);
  const chatTurn = useRef(0);
  const chatCtxKey = useRef("");

  useEffect(() => {
    api
      .get("/care/history")
      .then((res) => {
        setHistory(res.data.history || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function pickRotation(arr: string[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  /* ---------------- Level 1 check-in ---------------- */
  async function handleCheckIn(e: React.FormEvent) {
    e.preventDefault();
    if (!checkInText.trim()) return;
    setLoading(true);
    try {
      const res = await api.post("/care/checkin", { text: checkInText });
      const level = res.data.level as Level;
      setDetectedLevel(level);
      // Rotate the mood bucket based on reply tone
      chosenMood.current =
        checkInText.toLowerCase().match(/angry|tired|exhausted|heavy/) ? "calm" : "upbeat";

      if (level === "level_3") {
        setStage("results");
        toast.error(
          "I'm worried about you. Please reach out to a counselor right away, or your local emergency number if it's urgent."
        );
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

  /* ---------------- Activity handling ---------------- */
  async function runActivity(key: string) {
    try {
      await api.post("/care/activity", { activity: key });
    } catch {}

    let content = "";
    if (key === "music") {
      content = pickRotation(MUSIC[chosenMood.current]);
    } else if (key === "meme") {
      content = pickRotation(MEMES);
    } else if (key === "joke") {
      content = pickRotation(JOKES);
    } else if (key === "story") {
      content = pickRotation(STORIES);
    } else if (key === "breathing") {
      content = `${BREATHING.name}\n• ${BREATHING.steps.join("\n• ")}`;
    } else if (key === "meditation") {
      content = `${MEDITATION.name}\n• ${MEDITATION.steps.join("\n• ")}`;
    }

    setActiveActivity(key);
    setLastActivityContent(content);
    setShowMoodAsk(true);
  }

  async function handleMoodAnswer(improved: boolean) {
    try {
      await api.post("/care/mood", { moodImproved: improved });
    } catch {}

    setShowMoodAsk(false);
    saveMoodReflect(improved);
  }

  function saveMoodReflect(improved: boolean) {
    const msg = improved
      ? "That's wonderful! I'm so glad it helped. Remember, small steps count. 💙"
      : "That's completely okay. You were brave to try. Let's rest a bit — and I'm here if you want to talk. 💙";
    setVoiceLog((v) => [...v, msg]);
  }

  /* ---------------- Level 2: Voice conversation ---------------- */
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
      speak("I couldn't hear you clearly. Tap the microphone to try again, or just type below.");
    };
    rec.onend = () => setListening(false);

    recognitionRef.current = rec;
    rec.start();

    // Mira opens the conversation
    const opener = L2_OPENERS[Math.floor(Math.random() * L2_OPENERS.length)];
    setVoiceLog((v) => [...v, opener]);
    speak(opener);
  }

  function respondToVoice(transcript: string) {
    const log = (m: string) => setVoiceLog((v) => [...v, `You: ${transcript}`, `Mira: ${m}`]);
    const lower = transcript.toLowerCase();

    if (lower.match(/suicid|kill myself|end my life|hurt myself|harm myself|want to die/)) {
      const urgent =
        "I'm very concerned about you, and you don't have to go through this alone. Please reach out to a counselor right now, or call an emergency line / trusted person immediately. Let me show you counselors who can help.";
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
      const r = "Of course. I've found some caring counselors nearby. I'll show them to you on the screen — you can book an appointment right from here.";
      log(r);
      speak(r);
      return;
    }

    // Normal supportive response, rotate through empathetic lines
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
      const res = await api.get("/care/counselors", {
        params: { city, state },
      });
      setNearby(res.data.counselors || []);
    } catch {
      setNearby([]);
      toast.error("Couldn't load counselors right now.");
    } finally {
      setLoadingNearby(false);
    }
  }

  /* ---------------- AI Friend: context-aware text chat ---------------- */
  function startChat() {
    setChatActive(true);
    setMessages([{ role: "mira", text: pickRotation(WELCOME_LINES) }]);
    chatTurn.current = 0;
    chatCtxKey.current = "";
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
      // Reuse the existing emotion/mental-health detection classifier.
      const res = await api.post("/care/checkin", { text: content });
      const level = res.data.level as Level;
      const lower = content.toLowerCase();

      let reply = "";

      // Emergency escalation (existing workflow).
      if (level === "level_3" || /suicid|kill myself|end my life|hurt myself|harm myself|want to die|better off dead|end it all/.test(lower)) {
        setDetectedLevel("level_3");
        reply =
          "I'm very worried about you, and you don't have to go through this alone. Please reach out to a licensed counselor right now, or your local emergency line. I can show you counselors who can help — but this needs immediate human support.";
        loadNearby();
      } else if (level === "level_2" || LEVEL2_TRIGGERS.some((w) => lower.includes(w))) {
        // Level 2: serious supportive, offer voice + counselor.
        setDetectedLevel("level_2");
        if (chatTurn.current === 0) {
          reply = pickRotation([
            "I'm really glad you told me. This sounds heavy. Would it help to start a voice conversation with me? And I'd gently recommend talking to a counselor — shall I show you who's available?",
            "Thank you for trusting me. You don't have to carry this alone. Would you like me to find a counselor near you, or talk it through with me for a little while?",
          ]);
          loadNearby();
        } else {
          reply = pickRotation(L2_RESPONSES);
          loadNearby();
        }
      } else if (/counselor|book|doctor|professional|help/.test(lower)) {
        setDetectedLevel("level_2");
        loadNearby();
        reply = "Of course. I've found some caring counselors nearby — you can book an appointment right from here.";
      } else if (chatTurn.current === 0) {
        // NORMAL: friendly conversation + positive suggestion.
        setDetectedLevel("none");
        if (/good|great|happy|fine|okay|better|excited/.test(lower)) {
          reply = pickRotation([
            "That's lovely to hear! 🎉 What's made things feel better today?",
            "I'm so glad things are going well for you right now. What's one good thing about today?",
          ]);
        } else {
          reply = pickRotation([
            "I'm here for you. Could you tell me a little more about what's been going on?",
            EMPATHETIC_RESPONSES[0],
            WELCOME_LINES[1],
          ]);
        }
      } else if (chatTurn.current < 3) {
        // Maintain context: follow up on what they shared.
        chatCtxKey.current = chatCtxKey.current || content.slice(0, 40);
        reply = pickRotation([...CONTEXT_PROMPTS, ...EMPATHETIC_RESPONSES]);
      } else {
        // NORMAL: motivation + positive suggestion + mood check.
        reply = pickRotation([
          "You've been so honest with me today — that takes strength. Let's do one tiny thing that feels good: a short breathing exercise. Want to try?",
          "I really appreciate you talking with me. Remember, it's okay to have off days. Let's try an activity that might lift your mood — what sounds good?",
          "You're doing better than you think. Small steps count. Would you like to pick a mood-lifting activity from below?",
        ]);
        setDetectedLevel("level_1");
      }

      chatTurn.current += 1;
      setMessages((prev) => [...prev, { role: "mira", text: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "mira", text: "I'm here with you. Could you tell me a little more? 💙" },
      ]);
    } finally {
      setChatThinking(false);
    }
  }

  if (loading && history.length === 0 && stage === "intro") {
    return <Loading />;
  }

  const recent = history.slice(0, 5);

  /* --------------- Render --------------- */
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Mira Companion 💙</h2>
        <p className="mt-1 text-slate-500">
          Your AI friend. Judgement-free, awake at 3am, and always on your side.
        </p>
      </div>

      {/* AI Friend: chat interface */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">🤖 Chat with Mira</h3>
          {!chatActive ? (
            <button onClick={startChat} className="btn-primary">Start a conversation</button>
          ) : (
            <button onClick={() => setChatActive(false)} className="btn-outline">Close</button>
          )}
        </div>
        {chatActive && (
          <div className="mt-4">
<div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm sm:max-w-[80%] ${m.role === "user" ? "bg-blue-600 text-white" : "bg-white text-slate-700 border border-slate-200"}`}>
                    {m.text}
                  </div>
                </div>
              ))}
              {chatThinking && (
                <div className="flex justify-start">
                  <span className="rounded-2xl bg-white px-3 py-2 text-sm text-slate-400">Mira is thinking…</span>
                </div>
              )}
            </div>
            {detectedLevel === "level_2" && (
              <div className="mt-3 rounded-2xl bg-orange-50 p-4 text-sm text-orange-700">
                <p>
                  I'm here with you, and I care. I'm not a doctor — I'd gently encourage you to also talk to a qualified
                  counselor. You can book one below or start a voice conversation with me.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link to="/patient/counselors" className="btn-primary">📅 Book a Counselor</Link>
                  <button onClick={startVoice} className="btn-outline">🎙️ Voice with Mira</button>
                </div>
              </div>
            )}
            {detectedLevel === "level_3" && (
              <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="font-semibold">You matter, and you're not alone.</p>
                <p className="mt-1">
                  This needs immediate human support, not just an AI. Please reach out to a counselor now or your local
                  emergency number.
                </p>
                <Link to="/patient/emergency" className="btn-danger mt-3">🚨 Emergency Help</Link>
              </div>
            )}
            <form onSubmit={sendChat} className="mt-3 flex gap-2">
              <input
                className="input"
                placeholder="Talk to Mira…"
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
                disabled={chatThinking}
              />
              <button type="submit" className="btn-primary" disabled={chatThinking}>Send</button>
            </form>
            <p className="mt-2 text-[11px] text-slate-400">
              Mira is a supportive companion, not a medical professional, and does not replace a licensed counselor.
            </p>
          </div>
        )}
      </div>

      {/* Level 1 card */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-blue-600">Level 1</span>
          {detectedLevel === "level_1" && (
            <span className="badge bg-blue-100 text-blue-700">Active now</span>
          )}
        </div>
        <h3 className="mt-2 text-xl font-semibold">Temporary Sadness</h3>
        <p className="mt-1 text-sm text-slate-500">
          Mira lifts your mood with music, memes, jokes, motivational stories, breathing and meditation.
        </p>

        {stage === "intro" && (
          <div className="mt-5">
            <button
              onClick={() => setStage("checkin")}
              className="btn-primary"
            >
              ☁️ How are you feeling now?
            </button>
          </div>
        )}

        {stage === "checkin" && (
          <form onSubmit={handleCheckIn} className="mt-5 space-y-3">
            <label className="label">How are you feeling now?</label>
            <div className="flex flex-wrap gap-2">
              {["Feeling low", "A little sad", "Stressed and heavy", "Actually pretty good", "Empty or hopeless"].map(
                (opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setCheckInText(opt)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      checkInText === opt
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {opt}
                  </button>
                )
              )}
            </div>
            <textarea
              className="input"
              rows={2}
              placeholder="Or tell Mira in your own words…"
              value={checkInText}
              onChange={(e) => setCheckInText(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="submit" disabled={loading} className="btn-primary">
                {loading ? "Checking…" : "Continue"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDetectedLevel("none");
                  setCheckInText("");
                  setStage("intro");
                }}
                className="btn-outline"
              >
                Back
              </button>
            </div>
          </form>
        )}

        {stage === "results" && detectedLevel === "level_1" && (
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl bg-blue-50 p-4 text-sm text-slate-700">
              {voiceLog[voiceLog.length - 1] ||
                "I'm here with you. Let's find something to lift your mood. What sounds good?"}
            </div>

            {!activeActivity && (
              <>
                <p className="text-sm font-semibold text-slate-600">Pick something to lift your mood:</p>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {ACTIVITIES.map((a) => (
                    <button
                      key={a.key}
                      onClick={() => runActivity(a.key)}
                      className="rounded-2xl border border-slate-200 bg-white p-4 text-left transition-transform hover:-translate-y-0.5 hover:border-blue-300 hover:bg-blue-50"
                    >
                      <span className="text-2xl">{a.icon}</span>
                      <p className="mt-2 text-sm font-semibold">{a.label}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {activeActivity && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">
                    {ACTIVITIES.find((a) => a.key === activeActivity)?.icon}{" "}
                    {ACTIVITIES.find((a) => a.key === activeActivity)?.label}
                  </p>
                  <button
                    onClick={() => {
                      setActiveActivity(null);
                      setShowMoodAsk(false);
                    }}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Try another
                  </button>
                </div>
                <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{lastActivityContent}</p>

                {showMoodAsk && (
                  <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-700">Did your mood improve a little?</p>
                    <div className="mt-3 flex gap-2">
                      <button onClick={() => handleMoodAnswer(true)} className="btn-primary">
                        Yes, a bit 💙
                      </button>
                      <button onClick={() => handleMoodAnswer(false)} className="btn-outline">
                        Not yet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {stage === "results" && detectedLevel === "none" && (
          <div className="mt-5 rounded-2xl bg-green-50 p-4 text-sm text-green-700">
            Glad you're doing okay! Positive mood — no special support needed right now. Mira is
            always here if that changes. 💙
          </div>
        )}

        {stage === "results" && detectedLevel === "level_3" && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
            <p className="font-semibold text-red-700">You matter, and you're not alone.</p>
            <p className="mt-2 text-sm text-red-600">
              What you shared sounds very heavy, and I'm not able to handle a crisis. Please reach
              out to a licensed counselor immediately, or contact your local emergency number. I can
              help you find a counselor right now.
            </p>
            <Link to="/patient/emergency" className="btn-danger mt-4">Emergency Help</Link>
          </div>
        )}
      </div>

      {/* Level 2 card */}
      <div className="card p-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-orange-600">Level 2</span>
          {detectedLevel === "level_2" && (
            <span className="badge bg-orange-100 text-orange-700">Recommended for you</span>
          )}
        </div>
        <h3 className="mt-2 text-xl font-semibold">Moderate Distress</h3>
        <p className="mt-1 text-sm text-slate-500">
          If you go quiet, Mira starts a voice conversation and helps you book a counselor nearby.
        </p>

        <div className="mt-5 space-y-4">
          {!voiceActive ? (
            <button onClick={startVoice} className="btn-primary">
              🎙️ Start a voice conversation with Mira
            </button>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${listening ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-500"}`}>
                  {listening ? "🎤 Listening…" : "Not listening"}
                </span>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${speaking ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
                  {speaking ? "🔊 Mira speaking…" : "🔇 Muted"}
                </span>
              </div>

              <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl border border-slate-100 bg-slate-50 p-4 text-sm">
                {voiceLog.map((line, i) => (
                  <p key={i} className="text-slate-700">{line}</p>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                <button onClick={listenAgain} disabled={listening} className="btn-primary">
                  🎙️ Tap & speak
                </button>
                <button onClick={stopVoice} className="btn-outline">
                  End conversation
                </button>
                <button
                  onClick={() => {
                    const r = "I'm here, take your time.";
                    speak(r);
                    setVoiceLog((v) => [...v, `Mira: ${r}`]);
                  }}
                  className="btn-outline"
                >
                  🔊 Play last message
                </button>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => {
                    const msg = "I'd like to talk to a counselor";
                    setVoiceLog((v) => [...v, `You: ${msg}`]);
                    loadNearby();
                    const r = "Of course. Let me find someone caring near you.";
                    speak(r);
                    setVoiceLog((v) => [...v, `Mira: ${r}`]);
                  }}
                  className="btn-outline"
                >
                  💬 Talk to a Counselor
                </button>
                <button onClick={() => loadNearby()} className="btn-outline">
                  📅 Book a Counselor
                </button>
              </div>
            </>
          )}

          {/* Counselor picker */}
          {(nearby.length > 0 || loadingNearby) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="mb-3 font-semibold text-slate-700">Counselors available for you</p>
              {loadingNearby ? (
                <p className="text-sm text-slate-400">Finding counselors…</p>
              ) : nearby.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No counselors found near your location. Try browsing all counselors.
                </p>
              ) : (
                <div className="space-y-3">
                  {nearby.map((c) => (
                    <div key={c._id} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-100 p-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-blue-100">
                        {c.photo ? (
                          <img src={c.photo} alt={c.fullName} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-lg font-bold text-blue-700">{c.fullName?.[0] || "C"}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold">{c.fullName}</p>
                        <p className="text-xs text-slate-500">
                          {c.specialization} · {c.experience} yrs exp
                        </p>
                        <p className="text-xs text-slate-400">
                          {c.hospital || c.clinic} · {[c.city, c.district].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="badge bg-green-100 text-green-700">₹{c.consultationFee || "—"}</span>
                        <Link to={`/patient/book/${c._id}`} className="btn-primary">
                          Book Appointment
                        </Link>
                      </div>
                    </div>
                  ))}
                  <div className="pt-1">
                    <Link to="/patient/counselors" className="text-sm text-blue-600 hover:underline">
                      Browse all counselors →
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {detectedLevel === "level_2" && !voiceActive && (
            <p className="rounded-2xl bg-orange-50 p-4 text-sm text-orange-700">
              {voiceLog[voiceLog.length - 1] || L2_OPENERS[0]}
            </p>
          )}
        </div>
      </div>

      {/* Recent history */}
      {recent.length > 0 && (
        <div className="card p-6">
          <h3 className="mb-3 text-lg font-semibold">Your recent supportive check-ins</h3>
          <div className="space-y-2">
            {recent.map((h, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-2.5 text-sm">
                <span className="text-slate-600">
                  {h.type === "checkin" && `Check-in: "${h.checkInText || h.emotion}"`}
                  {h.type === "activity" && `Activity: ${h.activity}`}
                  {h.type === "mood" && `Mood improved: ${h.moodImproved ? "Yes 💙" : "Not yet"}`}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(h.createdAt).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
