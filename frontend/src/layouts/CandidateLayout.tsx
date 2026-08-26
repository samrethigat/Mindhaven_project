import { useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { useTheme } from "../context/ThemeContext";
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
  Brain,
  UserCheck,
  Calendar,
  AlertCircle,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

export function CandidateLayout() {
  const { user, logout } = useAuth();
  const { language, t, currentLanguageObj } = useLanguage();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = [
    { to: "/candidate/dashboard", label: t("nav_home"), icon: <Home className="w-4 h-4" /> },
    { to: "/candidate/assessment", label: t("nav_assessment"), icon: <Brain className="w-4 h-4 text-emerald-500" /> },
    { to: "/candidate/entertainment", label: t("nav_entertainment"), icon: <Sparkles className="w-4 h-4 text-purple-500" /> },
    { to: "/candidate/search", label: t("nav_search"), icon: <Search className="w-4 h-4 text-blue-500" /> },
    { to: "/candidate/ai-chat", label: t("nav_chat"), icon: <Sparkles className="w-4 h-4 text-blue-500" /> },
    { to: "/candidate/music", label: t("nav_music"), icon: <Music className="w-4 h-4 text-indigo-500" /> },
    { to: "/candidate/videos", label: t("nav_videos"), icon: <Film className="w-4 h-4 text-rose-500" /> },
    { to: "/candidate/memes", label: t("nav_memes"), icon: <Smile className="w-4 h-4 text-amber-500" /> },
    { to: "/candidate/memory", label: t("nav_memory"), icon: <Brain className="w-4 h-4 text-purple-500" /> },
    { to: "/candidate/counselors", label: t("nav_counselors"), icon: <UserCheck className="w-4 h-4 text-teal-500" /> },
    { to: "/candidate/appointments", label: t("nav_appointments"), icon: <Calendar className="w-4 h-4 text-sky-500" /> },
    { to: "/candidate/parents", label: t("nav_parents"), icon: <Users className="w-4 h-4 text-amber-500" /> },
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-50 flex flex-col justify-between transition-colors duration-250">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 px-4 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-xl p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-slate-900 dark:text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md">
            🧠
          </div>
          <span className="tracking-tight text-base font-extrabold">MINDHAVEN</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
          <LanguageSelector compact />
          <NotificationBell />
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={closeMobile}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col justify-between shadow-sm",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div>
          <div className="flex h-16 items-center justify-between border-b border-slate-100 dark:border-slate-800 px-5">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm shadow-md shadow-blue-500/20">
                🧠
              </div>
              <div>
                <span className="font-display font-extrabold tracking-tight text-slate-900 dark:text-white text-base">MINDHAVEN</span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Student Portal</span>
              </div>
            </Link>
            <button
              onClick={closeMobile}
              aria-label="Close menu"
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
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
                      ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-800"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
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
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Theme:</span>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Dark</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Language:</span>
            <LanguageSelector compact />
          </div>

          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-sm font-bold text-white shadow-sm">
              {user?.fullName?.[0] || user?.email?.[0]?.toUpperCase() || "S"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-slate-900 dark:text-white">{user?.fullName || user?.email}</p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">Student Profile</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 transition-colors shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{t("nav_logout")}</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 px-6 backdrop-blur-xl lg:flex transition-colors">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Psychology Platform</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <h1 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span>Mindhaven Student Support</span>
              <span className="badge bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-[10px]">
                {currentLanguageObj.name} ({currentLanguageObj.flag})
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Desktop Theme Toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle Light / Dark Mode"
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 shadow-sm transition-all"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>☀️ Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-600" />
                  <span>🌙 Dark Mode</span>
                </>
              )}
            </button>

            <Link
              to="/candidate/search"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:border-slate-300 transition-all shadow-sm"
            >
              <Search className="w-3.5 h-3.5 text-slate-400" />
              <span>Search...</span>
              <kbd className="rounded bg-white dark:bg-slate-900 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 border border-slate-200 dark:border-slate-700">
                ⌘K
              </kbd>
            </Link>
            <LanguageSelector />
            <Link
              to="/candidate/ai-chat"
              className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>{t("nav_chat")}</span>
            </Link>
            <Link
              to="/candidate/emergency"
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 px-3 py-1 text-xs font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors"
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
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
