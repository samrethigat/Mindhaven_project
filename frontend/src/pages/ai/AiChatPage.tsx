import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useMusic } from "../../context/MusicContext";
import { useLanguage } from "../../context/LanguageContext";
import { api, getErrorMessage } from "../../lib/api";
import { usePageTitle } from "../../lib/usePageTitle";
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Edit2,
  Copy,
  RotateCcw,
  Play,
  Film,
  User as UserIcon,
  MessageSquare,
  ChevronRight,
  Check,
  X,
  Brain,
  Search,
  Square,
  Eraser,
  Smile,
  ShieldCheck,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";

interface Message {
  _id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  action?: {
    type: string;
    payload: any;
  } | null;
  createdAt?: string;
}

interface Conversation {
  _id: string;
  title: string;
  pinned?: boolean;
  lastMessageAt?: string;
}

export function AiChatPage() {
  const { user } = useAuth();
  const { playSong, pause, playNext, playPrev, setVol } = useMusic();
  const { language, setLanguage, t, currentLanguageObj } = useLanguage();

  usePageTitle(`AI Chat - ${currentLanguageObj.nativeName}`);

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [convSearch, setConvSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Stop Generation Abort Controller
  const abortControllerRef = useRef<AbortController | null>(null);

  // Voice recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Text to speech state
  const [speakingMsgIndex, setSpeakingMsgIndex] = useState<number | null>(null);

  // Edit conversation title state
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadConversations();
  }, [convSearch]);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    } else {
      setMessages([]);
    }
  }, [activeConvId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function loadConversations() {
    setLoading(true);
    try {
      const res = await api.get("/ai/conversations", {
        params: { search: convSearch },
      });
      const list = res.data.conversations || [];
      setConversations(list);
      if (list.length > 0 && !activeConvId) {
        setActiveConvId(list[0]._id);
      }
    } catch {
      toast.error(language === "ta" ? "உரையாடல்களை ஏற்றுவதில் பிழை" : "Error loading conversations");
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(convId: string) {
    try {
      const res = await api.get(`/ai/conversations/${convId}`);
      setMessages(res.data.messages || []);
    } catch {
      toast.error(language === "ta" ? "செய்திகளை ஏற்றுவதில் பிழை" : "Error loading messages");
    }
  }

  async function handleCreateNewChat() {
    try {
      const title = language === "ta" ? "புதிய உரையாடல்" : "New Chat";
      const res = await api.post("/ai/conversations", { title });
      const newConv = res.data.conversation;
      setConversations([newConv, ...conversations]);
      setActiveConvId(newConv._id);
      setMessages([]);
      toast.success(language === "ta" ? "புதிய உரையாடல் தொடங்கப்பட்டது ✨" : "New chat started ✨");
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }

  async function handleSendMessage(textToSend?: string) {
    const content = (textToSend || input).trim();
    if (!content || sending) return;

    setInput("");
    setSending(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Optimistic user message
    const tempUserMsg: Message = {
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await api.post(
        "/ai/chat",
        {
          conversationId: activeConvId,
          message: content,
        },
        { signal: controller.signal }
      );

      const { conversation, assistantMessage } = res.data;

      if (!activeConvId || activeConvId !== conversation._id) {
        setActiveConvId(conversation._id);
        setConversations((prev) => [conversation, ...prev.filter((c) => c._id !== conversation._id)]);
      } else {
        setConversations((prev) =>
          prev.map((c) => (c._id === conversation._id ? { ...c, title: conversation.title } : c))
        );
      }

      setMessages((prev) => [...prev.filter((m) => m !== tempUserMsg), res.data.userMessage, assistantMessage]);

      if (assistantMessage.action) {
        handleExecuteAction(assistantMessage.action);
      }
    } catch (err: any) {
      if (err.name === "CanceledError" || err.code === "ERR_CANCELED") {
        toast(language === "ta" ? "பதில் நிறுத்திவைக்கப்பட்டது ⏹️" : "Generation stopped ⏹️");
      } else {
        toast.error(getErrorMessage(err));
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              language === "ta"
                ? "மன்னிக்கவும் 😔 AI சேவையில் தற்காலிக பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்."
                : "Sorry 😔 An error occurred while processing your request. Please try again.",
            createdAt: new Date().toISOString(),
          },
        ]);
      }
    } finally {
      setSending(false);
      abortControllerRef.current = null;
    }
  }

  function handleStopGeneration() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setSending(false);
    }
  }

  async function handleRegenerate() {
    if (!activeConvId || sending) return;
    setSending(true);

    try {
      const res = await api.post("/ai/chat/regenerate", { conversationId: activeConvId });
      const newAssistantMsg = res.data.assistantMessage;

      // Replace last assistant message
      setMessages((prev) => {
        const withoutLast = prev[prev.length - 1]?.role === "assistant" ? prev.slice(0, -1) : prev;
        return [...withoutLast, newAssistantMsg];
      });

      if (newAssistantMsg.action) {
        handleExecuteAction(newAssistantMsg.action);
      }
      toast.success(language === "ta" ? "புதிய பதில் உருவாக்கப்பட்டது ✨" : "Response regenerated ✨");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  async function handleClearChat() {
    if (!activeConvId) return;
    if (!confirm(language === "ta" ? "இந்த உரையாடலை அழிக்க விரும்புகிறீர்களா?" : "Clear all messages in this conversation?")) return;

    try {
      await api.delete(`/ai/conversations/${activeConvId}/clear`);
      setMessages([]);
      toast.success(language === "ta" ? "செய்திகள் அழிக்கப்பட்டன" : "Messages cleared");
    } catch {
      toast.error("Error clearing messages");
    }
  }

  function handleExecuteAction(action: { type: string; payload: any }) {
    if (action.type === "PLAY_MUSIC" && action.payload?.song) {
      playSong(action.payload.song);
      toast.success(
        language === "ta"
          ? `பாடலை இயக்குகிறேன்: ${action.payload.song.title} 🎵`
          : `Playing: ${action.payload.song.title} 🎵`
      );
    } else if (action.type === "PAUSE_MUSIC") {
      pause();
      toast(language === "ta" ? "பாடல் இடைநிறுத்தப்பட்டது ⏸️" : "Music paused ⏸️");
    } else if (action.type === "NEXT_SONG") {
      playNext();
      toast(language === "ta" ? "அடுத்த பாடல் ⏭️" : "Next song ⏭️");
    } else if (action.type === "PREVIOUS_SONG") {
      playPrev();
      toast(language === "ta" ? "முந்தைய பாடல் ⏮️" : "Previous song ⏮️");
    } else if (action.type === "SET_VOLUME" && action.payload?.volume !== undefined) {
      setVol(action.payload.volume);
    } else if (action.type === "CHANGE_LANGUAGE" && action.payload?.language) {
      setLanguage(action.payload.language);
    }
  }

  // Voice Input (Multilingual STT)
  function startVoiceRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(
        language === "ta"
          ? "இந்த உலாவியில் குரல் அறிதல் ஆதரிக்கப்படவில்லை (Chrome/Edge பயன்படுத்தவும்)."
          : "Voice recognition is not supported in this browser."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = currentLanguageObj.speechCode;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      toast(t("chat_voice_listening"));
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      if (transcript) {
        setInput(transcript);
        handleSendMessage(transcript);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      toast.error(
        language === "ta"
          ? "குரல் சரியாக கேட்கவில்லை. மீண்டும் முயற்சிக்கவும்."
          : "Voice not recognized. Please try again."
      );
    };

    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  }

  function stopVoiceRecognition() {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }

  // Text to speech (Multilingual TTS)
  function speakText(text: string, index: number) {
    if (!("speechSynthesis" in window)) {
      toast.error("Speech synthesis is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    if (speakingMsgIndex === index) {
      setSpeakingMsgIndex(null);
      return;
    }

    const cleanText = text.replace(/[*_#`[\]()]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = currentLanguageObj.speechCode;
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    utterance.onstart = () => setSpeakingMsgIndex(index);
    utterance.onend = () => setSpeakingMsgIndex(null);
    utterance.onerror = () => setSpeakingMsgIndex(null);

    window.speechSynthesis.speak(utterance);
  }

  async function handleDeleteConv(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(language === "ta" ? "இந்த உரையாடலை நீக்க விரும்புகிறீர்களா?" : "Delete this conversation?")) return;

    try {
      await api.delete(`/ai/conversations/${id}`);
      const updated = conversations.filter((c) => c._id !== id);
      setConversations(updated);
      if (activeConvId === id) {
        setActiveConvId(updated.length > 0 ? updated[0]._id : null);
      }
      toast.success(language === "ta" ? "உரையாடல் நீக்கப்பட்டது" : "Conversation deleted");
    } catch {
      toast.error("Error deleting conversation");
    }
  }

  async function handleSaveRename(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!editTitle.trim()) return;

    try {
      await api.put(`/ai/conversations/${id}`, { title: editTitle.trim() });
      setConversations(
        conversations.map((c) => (c._id === id ? { ...c, title: editTitle.trim() } : c))
      );
      setEditingConvId(null);
      toast.success(language === "ta" ? "தலைப்பு மாற்றப்பட்டது" : "Title updated");
    } catch {
      toast.error("Error updating title");
    }
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
    toast.success(language === "ta" ? "நகலெடுக்கப்பட்டது (Copied) 📋" : "Copied to clipboard 📋");
  }

  // Quick Prompt Chips
  const quickPrompts =
    language === "ta"
      ? [
          { icon: "🎵", text: "எனக்கு ஒரு மெலடி பாடல் போடு", label: "Melody Song" },
          { icon: "⚡", text: "ஒரு மோட்டிவேஷன் பாடல் இயக்கு", label: "Motivation Music" },
          { icon: "🎬", text: "ஒரு நல்ல மோட்டிவேஷன் வீடியோ காட்டு", label: "Motivational Video" },
          { icon: "👤", text: "என் பெயர் என்ன?", label: "Who Am I?" },
          { icon: "😂", text: "ஒரு சிரிப்பான தமிழ் மீம் காட்டு", label: "Tamil Meme" },
          { icon: "💻", text: "What is Machine Learning and its types?", label: "Tech Question" },
        ]
      : [
          { icon: "🎵", text: "Play a soothing melody song", label: "Melody Song" },
          { icon: "⚡", text: "Play a motivational Tamil song", label: "Motivation Music" },
          { icon: "🎬", text: "Show me a motivational video", label: "Motivational Video" },
          { icon: "👤", text: "What is my name and profile info?", label: "Who Am I?" },
          { icon: "😂", text: "Show me a funny Tamil meme", label: "Tamil Meme" },
          { icon: "💻", text: "What is Machine Learning and its types?", label: "Tech Question" },
        ];

  return (
    <div className="flex h-[calc(100vh-8.5rem)] rounded-3xl border border-slate-200/80 bg-white shadow-xl overflow-hidden backdrop-blur-xl">
      {/* Left Sidebar: Conversation Threads */}
      <div
        className={`${
          sidebarOpen ? "w-72 sm:w-80" : "w-0"
        } transition-all duration-300 ease-in-out border-r border-slate-200/80 bg-slate-50/70 flex flex-col justify-between overflow-hidden`}
      >
        <div className="p-3.5 border-b border-slate-200/60 space-y-2">
          <button
            onClick={handleCreateNewChat}
            className="flex items-center justify-center gap-2 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t("chat_new_btn")}</span>
          </button>

          {/* Search Conversations */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
              placeholder="Search chats..."
              className="input pl-8 py-1 text-xs w-full"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-thin">
          <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {language === "ta" ? "முந்தைய உரையாடல்கள்" : "Previous Chats"}
          </p>

          {conversations.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              {language === "ta" ? "உரையாடல்கள் எதுவும் இல்லை." : "No chats found."}
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = activeConvId === conv._id;
              return (
                <div
                  key={conv._id}
                  onClick={() => setActiveConvId(conv._id)}
                  className={`group relative flex items-center justify-between gap-2 rounded-2xl px-3.5 py-2.5 text-xs font-semibold cursor-pointer transition-all ${
                    isActive
                      ? "bg-white text-blue-700 shadow-sm border border-blue-100 font-bold"
                      : "text-slate-600 hover:bg-white/80 hover:text-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare className={`w-3.5 h-3.5 flex-shrink-0 ${isActive ? "text-blue-600" : "text-slate-400"}`} />
                    {editingConvId === conv._id ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="input py-0.5 px-1.5 text-xs w-full"
                        autoFocus
                      />
                    ) : (
                      <span className="truncate">{conv.title}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingConvId === conv._id ? (
                      <>
                        <button
                          onClick={(e) => handleSaveRename(conv._id, e)}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingConvId(null);
                          }}
                          className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingConvId(conv._id);
                            setEditTitle(conv.title);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded-lg"
                          title="Rename"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteConv(conv._id, e)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* User Memory Badge Footer */}
        <div className="p-3 border-t border-slate-200/60 bg-white/60 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Brain className="w-4 h-4 text-purple-600" />
            <span className="font-semibold">{language === "ta" ? "நினைவகம் செயலில் உள்ளது" : "AI Memory Active"}</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      </div>

      {/* Right: Active Chat View */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        {/* Chat Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-6 bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 transition-colors"
              title="Toggle sidebar"
            >
              <MessageSquare className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-500/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>Mira AI Assistant</span>
                  <span className="badge bg-blue-50 text-blue-700 border border-blue-200 text-[10px] py-0.5">
                    {currentLanguageObj.nativeName}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  {language === "ta"
                    ? "தனிப்பயனாக்கப்பட்ட தமிழ் மற்றும் பன்மொழி AI உதவியாளர்"
                    : "Personalized Multilingual AI Wellness & Knowledge Assistant"}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Clear messages"
              >
                <Eraser className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={handleCreateNewChat}
              className="btn-outline text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t("chat_new_btn")}</span>
            </button>
          </div>
        </div>

        {/* Privacy & Safe Venting Banner */}
        <div className="px-4 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 font-semibold text-slate-600">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>{language === "ta" ? "100% ரகசிய & பாதுகாப்பான AI உரையாடல்" : "100% Confidential & Safe Venting Space"}</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline">{language === "ta" ? "உரையாடல்கள் யாருடனும் பகிரப்படாது" : "Chat transcripts are strictly private"}</span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            /* Welcome / Empty State */
            <div className="flex flex-col items-center justify-center min-h-[380px] text-center max-w-2xl mx-auto space-y-6 animate-fade-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/25">
                <Sparkles className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                  {t("dash_greeting_prefix")}, {user?.fullName || "Friend"}! 👋
                </h2>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {t("dash_hero_desc")}
                </p>
              </div>

              {/* Quick Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                {quickPrompts.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(p.text)}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/80 hover:border-blue-200 text-left transition-all group"
                  >
                    <span className="text-xl group-hover:scale-110 transition-transform">{p.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-800 group-hover:text-blue-700">{p.text}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{p.label}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isUser = msg.role === "user";
              const isSpeaking = speakingMsgIndex === idx;

              return (
                <div
                  key={idx}
                  className={`flex items-start gap-3.5 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
                >
                  {!isUser && (
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}

                  <div className="max-w-[85%] sm:max-w-[75%] space-y-2">
                    <div
                      className={`rounded-3xl px-5 py-3.5 text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-tr-sm"
                          : "bg-slate-50 border border-slate-200/70 text-slate-800 rounded-tl-sm"
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.content}</p>

                      {/* Action Embed Cards */}
                      {msg.action && (
                        <div className="mt-3 pt-3 border-t border-slate-200/60">
                          {/* 1. Music Player Card */}
                          {msg.action.type === "PLAY_MUSIC" && msg.action.payload?.song && (
                            <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-blue-200 shadow-sm">
                              <div className="flex items-center gap-3">
                                <img
                                  src={msg.action.payload.song.coverUrl}
                                  alt={msg.action.payload.song.title}
                                  className="w-10 h-10 rounded-xl object-cover"
                                />
                                <div>
                                  <p className="font-bold text-xs text-slate-900">
                                    {msg.action.payload.song.title}
                                  </p>
                                  <p className="text-[10px] text-slate-500">
                                    {msg.action.payload.song.artist}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => msg.action?.payload?.song && playSong(msg.action.payload.song)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm"
                              >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                <span>Play</span>
                              </button>
                            </div>
                          )}

                          {/* 2. Video Player Embed Card */}
                          {msg.action.type === "PLAY_VIDEO" && msg.action.payload?.video && (
                            <div className="rounded-2xl bg-white border border-slate-200 p-3 shadow-sm space-y-2">
                              <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <Film className="w-3.5 h-3.5 text-rose-500" />
                                {msg.action.payload.video.title}
                              </p>
                              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900">
                                <iframe
                                  src={msg.action.payload.video.embedUrl}
                                  title={msg.action.payload.video.title}
                                  className="w-full h-full"
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            </div>
                          )}

                          {/* 3. Meme Embed Card */}
                          {msg.action.type === "SHOW_MEME" && msg.action.payload?.meme && (
                            <div className="rounded-2xl bg-white border border-amber-200 p-3 shadow-sm space-y-2">
                              <p className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                                <Smile className="w-3.5 h-3.5 text-amber-500" />
                                {msg.action.payload.meme.title}
                              </p>
                              <img
                                src={msg.action.payload.meme.imageUrl}
                                alt={msg.action.payload.meme.title}
                                className="w-full max-h-60 object-cover rounded-xl"
                              />
                            </div>
                          )}

                          {/* 4. Profile Card */}
                          {msg.action.type === "SHOW_PROFILE" && (
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-teal-200 text-xs">
                              <UserIcon className="w-5 h-5 text-teal-600" />
                              <div>
                                <p className="font-bold text-slate-900">{user?.fullName}</p>
                                <p className="text-slate-500">{user?.email} · {user?.college || "Student"}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Message Actions Bar & Timestamp */}
                    <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400">
                      {msg.createdAt && (
                        <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      )}

                      {!isUser && (
                        <>
                          <button
                            onClick={() => speakText(msg.content, idx)}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-medium transition-colors ${
                              isSpeaking
                                ? "bg-blue-50 text-blue-700 font-bold"
                                : "hover:text-slate-700 hover:bg-slate-100"
                            }`}
                            title="Speak Text"
                          >
                            {isSpeaking ? (
                              <>
                                <VolumeX className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                                <span>{language === "ta" ? "நிறுத்து" : "Stop"}</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5" />
                                <span>{language === "ta" ? "வாசி" : "Speak"}</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => handleCopy(msg.content)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs hover:text-slate-700 hover:bg-slate-100 transition-colors"
                            title="Copy text"
                          >
                            <Copy className="w-3 h-3" />
                            <span>{language === "ta" ? "நகல்" : "Copy"}</span>
                          </button>

                          {idx === messages.length - 1 && (
                            <button
                              onClick={handleRegenerate}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs hover:text-blue-600 hover:bg-blue-50 transition-colors"
                              title="Regenerate response"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{language === "ta" ? "மீண்டும் உருவாக்கு" : "Retry"}</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white font-bold text-xs shadow-md">
                      {user?.fullName?.[0] || "U"}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex items-start gap-3.5 justify-start animate-fade-in">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="rounded-3xl rounded-tl-sm px-5 py-3.5 bg-slate-50 border border-slate-200/70 text-slate-500 text-xs flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>{t("chat_thinking")}</span>
                <button
                  onClick={handleStopGeneration}
                  className="ml-2 flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 font-bold hover:bg-rose-100 transition-colors"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 p-1.5 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10 transition-all shadow-sm"
          >
            {/* Voice Input Microphone Button */}
            <button
              type="button"
              onClick={isListening ? stopVoiceRecognition : startVoiceRecognition}
              className={`p-2.5 rounded-xl transition-all ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/25"
                  : "text-slate-400 hover:text-blue-600 hover:bg-white"
              }`}
              title={isListening ? "Listening... Click to stop" : "Speak to AI"}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? t("chat_voice_listening") : t("chat_placeholder")}
              className="flex-1 bg-transparent px-2 py-1.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
              disabled={sending}
            />

            {sending ? (
              <button
                type="button"
                onClick={handleStopGeneration}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-all"
                title="Stop generation"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-40"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
