import { useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { NotificationBell } from "../components/NotificationBell";
import { PermissionIntro } from "../components/PermissionIntro";
import { PersistentPlayer } from "../components/PersistentPlayer";
import { LanguageSelector } from "../components/LanguageSelector";
import {
  Home,
  Sparkles,
  Music,
  Film,
  Smile,
  Search,
  Heart,
  Clock,
  Brain,
  UserCheck,
  Calendar,
  AlertCircle,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

export function CandidateLayout() {
  const { user, logout } = useAuth();
  const { language, t, currentLanguageObj } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { to: "/candidate/dashboard", label: t("nav_home"), icon: <Home className="w-4 h-4" /> },
    { to: "/candidate/entertainment", label: language === "ta" ? "பன்மொழி பொழுதுபோக்கு" : "Entertainment Hub", icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
    { to: "/candidate/search", label: language === "ta" ? "பொதுத் தேடல்" : "Global Search", icon: <Search className="w-4 h-4 text-blue-500" /> },
    { to: "/candidate/ai-chat", label: t("nav_chat"), icon: <Sparkles className="w-4 h-4 text-blue-500" /> },
    { to: "/candidate/music", label: t("nav_music"), icon: <Music className="w-4 h-4 text-indigo-500" /> },
    { to: "/candidate/videos", label: t("nav_videos"), icon: <Film className="w-4 h-4 text-rose-500" /> },
    { to: "/candidate/memes", label: t("nav_memes"), icon: <Smile className="w-4 h-4 text-amber-500" /> },
    { to: "/candidate/favorites", label: t("nav_favorites"), icon: <Heart className="w-4 h-4 text-rose-500" /> },
    { to: "/candidate/history", label: t("nav_history"), icon: <Clock className="w-4 h-4 text-sky-500" /> },
    { to: "/candidate/memory", label: t("nav_memory"), icon: <Brain className="w-4 h-4 text-purple-500" /> },
    { to: "/candidate/counselors", label: t("nav_counselors"), icon: <UserCheck className="w-4 h-4 text-teal-500" /> },
    { to: "/candidate/appointments", label: t("nav_appointments"), icon: <Calendar className="w-4 h-4 text-sky-500" /> },
    { to: "/candidate/parents", label: language === "ta" ? "பெற்றோர் இணைப்பு" : "Parent Link & Privacy", icon: <Users className="w-4 h-4 text-amber-500" /> },
    { to: "/candidate/emergency", label: t("nav_sos"), icon: <AlertCircle className="w-4 h-4 text-rose-500" /> },
    { to: "/candidate/settings", label: t("nav_settings"), icon: <Settings className="w-4 h-4 text-slate-500" /> },
  ];

  async function handleLogout() {
    await logout();
    toast.success(t("nav_logout"));
    navigate("/login/candidate");
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-50/70 font-sans text-slate-900 flex flex-col justify-between">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-slate-900">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md">
            🧠
          </div>
          <span className="tracking-tight text-base font-extrabold">MINDHAVEN</span>
        </Link>
        <div className="flex items-center gap-2">
          <LanguageSelector compact />
          <NotificationBell />
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200/80 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col justify-between shadow-sm",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div>
          <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-500/20">
                🧠
              </div>
              <div>
                <span className="font-display font-extrabold tracking-tight text-slate-900 text-base">MINDHAVEN</span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600">AI Assistant</span>
              </div>
            </Link>
            <button
              onClick={closeMobile}
              aria-label="Close menu"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="max-h-[calc(100vh-13rem)] space-y-1 overflow-y-auto p-3.5">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobile}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm font-bold transition-all",
                    isActive
                      ? "bg-blue-50 text-blue-700 shadow-sm border border-blue-100"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  )
                }
              >
                <span>{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User profile & Language footer */}
        <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-500">Language:</span>
            <LanguageSelector compact />
          </div>

          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
              {user?.fullName?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900">{user?.fullName || user?.email}</p>
              <p className="text-[11px] text-blue-600 font-medium">User Profile</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t("nav_logout")}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">AI Platform</span>
            <span className="text-slate-300">•</span>
            <h1 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <span>Mira Multilingual AI Assistant</span>
              <span className="badge bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px]">
                {currentLanguageObj.nativeName} ({currentLanguageObj.flag})
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/candidate/search"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 text-xs text-slate-500 hover:bg-white hover:border-slate-300 hover:text-slate-900 transition-all shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>{language === "ta" ? "தேடுக..." : "Search..."}</span>
              <kbd className="rounded bg-white px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200">
                ⌘K
              </kbd>
            </Link>
            <LanguageSelector />
            <Link
              to="/candidate/ai-chat"
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{t("nav_chat")}</span>
            </Link>
            <Link
              to="/candidate/emergency"
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>{t("nav_sos")}</span>
            </Link>
            <NotificationBell />
            <Link to="/candidate/settings" className="btn-outline text-xs py-1.5 px-3">
              {t("nav_settings")}
            </Link>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>

      {/* Global Persistent Music Player */}
      <PersistentPlayer />
      <PermissionIntro />
    </div>
  );
}
