import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Bell,
  BookHeart,
  CalendarHeart,
  CalendarClock,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  MessageCircleHeart,
  MessagesSquare,
  Moon,
  Settings,
  ShieldCheck,
  Siren,
  ShieldAlert,
  Stethoscope,
  Sun,
  Users,
} from "lucide-react";

const STUDENT_NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/companion", label: "AI friend", icon: MessageCircleHeart },
  { to: "/wellbeing", label: "Mood & sleep", icon: Moon },
  { to: "/journal", label: "Journal", icon: BookHeart },
  { to: "/counsellors", label: "Counsellors", icon: Users },
  { to: "/appointments", label: "My appointments", icon: CalendarHeart },
  { to: "/messages", label: "Messages", icon: MessagesSquare },
  { to: "/emergency", label: "Emergency help", icon: LifeBuoy },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const COUNSELLOR_NAV = [
  { to: "/counsellor", label: "Practice", icon: Stethoscope },
  { to: "/emergency-cases", label: "🚨 Emergency", icon: Siren },
  { to: "/appointment-requests", label: "📅 Appointment requests", icon: CalendarClock },
  { to: "/appointments", label: "Appointments", icon: CalendarHeart },
  { to: "/messages", label: "Messages", icon: MessagesSquare },
  { to: "/account-settings", label: "Account settings", icon: ShieldAlert },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const ADMIN_NAV = [{ to: "/admin", label: "Admin", icon: ShieldCheck }] as const;

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const stored = localStorage.getItem("mh_theme");
    const isDark = stored ? stored === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  const toggle = () => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("mh_theme", next ? "dark" : "light");
      return next;
    });
  };
  return { dark, toggle };
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { isCounsellor, isAdmin } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const items = [
    ...(isCounsellor ? COUNSELLOR_NAV : STUDENT_NAV),
    ...(isAdmin ? ADMIN_NAV : []),
  ];

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "gradient-primary text-primary-foreground shadow-[var(--shadow-soft)]"
                : "text-muted-foreground hover:bg-accent/40 hover:text-foreground"
            }`}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NotificationBell() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["notifications", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("notif-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => queryClient.invalidateQueries({ queryKey: ["notifications", user.id] }),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const unread = (data ?? []).filter((n) => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="size-5" />
          {unread > 0 && (
            <Badge className="absolute -top-1 -right-1 size-5 justify-center rounded-full p-0 text-[10px]">
              {unread}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3 text-sm font-semibold">Notifications</div>
        <div className="max-h-80 overflow-y-auto">
          {(data ?? []).length === 0 && (
            <p className="p-4 text-sm text-muted-foreground">Nothing yet.</p>
          )}
          {(data ?? []).map((n) => (
            <button
              key={n.id}
              className="block w-full border-b px-4 py-3 text-left last:border-0 hover:bg-accent/30"
              onClick={async () => {
                await supabase.from("notifications").update({ read: true }).eq("id", n.id);
                void queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
              }}
            >
              <p className="text-sm font-medium">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.body}</p>
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { dark, toggle } = useDarkMode();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", search: { portal: "student" }, replace: true });
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <div className="mx-auto flex max-w-7xl">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border/60 p-4 lg:flex">
          <Link to="/dashboard" className="mb-6 block">
            <Logo />
          </Link>
          <NavLinks />
          <Button variant="ghost" className="mt-auto justify-start gap-3" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="size-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-4">
                  <Logo />
                  <div className="mt-6">
                    <NavLinks />
                  </div>
                  <Button variant="ghost" className="mt-6 w-full justify-start gap-3" onClick={signOut}>
                    <LogOut className="size-4" /> Sign out
                  </Button>
                </SheetContent>
              </Sheet>
              <span className="lg:hidden">
                <Logo compact />
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle dark mode">
                {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
              </Button>
              <NotificationBell />
            </div>
          </header>
          <main className="p-4 md:p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}