import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  HeartHandshake,
  Calendar,
  Settings,
  LogOut,
  Globe,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

export function ParentLayout() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Ensure English language mode inside Parent Portal
  useEffect(() => {
    if (language !== "en") {
      setLanguage("en", false);
    }
  }, [language, setLanguage]);

  const navItems = [
    { to: "/parent/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/parent/students", icon: Users, label: "Linked Students" },
    { to: "/parent/alerts", icon: AlertTriangle, label: "Wellbeing Alerts" },
    { to: "/parent/counselors", icon: HeartHandshake, label: "Find Counselors" },
    { to: "/parent/appointments", icon: Calendar, label: "Appointments" },
    { to: "/parent/settings", icon: Settings, label: "Settings" },
  ];

  async function handleLogout() {
    await logout();
    navigate("/login/parent");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-800 font-sans">
      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center text-white font-bold">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-slate-900 tracking-tight">MindHaven</h1>
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Parent Portal</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Sidebar for Desktop & Mobile Overlay */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 p-5 flex flex-col justify-between transition-transform duration-300 md:static md:translate-x-0 ${
          mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-3 mb-6">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-900 leading-tight">MindHaven</h2>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 bg-amber-100 rounded-full">
                PARENT PORTAL
              </span>
            </div>
          </div>

          {/* User Preview */}
          <div className="p-3 mb-6 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-200 text-amber-800 font-black flex items-center justify-center text-sm">
              {user?.fullName?.charAt(0) || "P"}
            </div>
            <div className="overflow-hidden">
              <p className="font-bold text-xs text-slate-900 truncate">{user?.fullName || "Parent User"}</p>
              <p className="text-[10px] text-slate-500 truncate">
                {user?.relationshipToStudent || "Parent"} • {user?.email}
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Actions */}
        <div className="pt-4 border-t border-slate-100 space-y-2">
          {/* Language Switch */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl">
            <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Language
            </span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="en">English</option>
              <option value="ta">தமிழ்</option>
              <option value="hi">हिन्दी</option>
              <option value="te">తెలుగు</option>
            </select>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
}
