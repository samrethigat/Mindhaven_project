import { useState } from "react";
import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "../components/NotificationBell";
import { 
  Home, 
  User, 
  Inbox, 
  Calendar, 
  Users, 
  MessageSquare, 
  Bell, 
  Clock, 
  Settings, 
  LogOut,
  Menu,
  X,
  ShieldAlert
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "../lib/utils";

const nav = [
  { to: "/counselor/dashboard", label: "Dashboard", icon: <Home className="w-4 h-4" /> },
  { to: "/counselor/profile", label: "My Profile & Bio", icon: <User className="w-4 h-4 text-blue-300" /> },
  { to: "/counselor/appointment-requests", label: "Incoming Requests", icon: <Inbox className="w-4 h-4 text-amber-300" /> },
  { to: "/counselor/appointments", label: "All Appointments", icon: <Calendar className="w-4 h-4 text-sky-300" /> },
  { to: "/counselor/patients", label: "Assigned Candidates", icon: <Users className="w-4 h-4 text-teal-300" /> },
  { to: "/counselor/chats", label: "Live Chats", icon: <MessageSquare className="w-4 h-4 text-emerald-300" /> },
  { to: "/counselor/notifications", label: "Notifications", icon: <Bell className="w-4 h-4 text-amber-300" /> },
  { to: "/counselor/availability", label: "Weekly Schedule", icon: <Clock className="w-4 h-4 text-indigo-300" /> },
  { to: "/counselor/settings", label: "Account Settings", icon: <Settings className="w-4 h-4 text-slate-300" /> },
];

export function CounselorLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await logout();
    toast.success("Logged out successfully");
    navigate("/login/counselor");
  }

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-900">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className="rounded-xl p-2 text-slate-700 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
        <Link to="/" className="flex items-center gap-2 font-display font-extrabold text-slate-900">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-700 text-white font-bold text-xs">
            🧑‍⚕️
          </div>
          <span>MINDHAVEN</span>
        </Link>
        <NotificationBell />
      </header>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity" 
          onClick={closeMobile} 
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 border-r border-slate-800 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 text-white transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col justify-between",
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <div>
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white text-sm font-bold shadow-md shadow-blue-500/30">
                🧑‍⚕️
              </div>
              <div>
                <span className="font-display font-extrabold tracking-tight text-white text-base">MINDHAVEN</span>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-300">Counselor Portal</span>
              </div>
            </Link>
            <button
              onClick={closeMobile}
              aria-label="Close menu"
              className="rounded-xl p-2 text-blue-200 hover:bg-white/10 lg:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <nav className="max-h-[calc(100vh-10rem)] space-y-1 overflow-y-auto p-3.5">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={closeMobile}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all",
                    isActive 
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" 
                      : "text-blue-100 hover:bg-white/10 hover:text-white"
                  )
                }
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* User Profile in Sidebar */}
        <div className="p-3.5 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm">
              {user?.fullName?.[0] || user?.email?.[0]?.toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold text-white">{user?.fullName || user?.email}</p>
              <p className="text-[11px] text-blue-300 font-medium">Licensed Counselor</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="mt-2.5 flex items-center justify-center gap-2 w-full rounded-xl bg-white/10 border border-white/10 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 hidden h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 backdrop-blur-xl lg:flex">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Portal</span>
            <span className="text-slate-300">•</span>
            <h1 className="text-sm font-bold text-slate-800">Counselor & Psychological Care Station</h1>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Available for Consultations</span>
            </span>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
