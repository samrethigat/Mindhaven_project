import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "student" | "counsellor" | "admin";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async (s: Session | null) => {
      if (!active) return;
      setSession(s);
      if (!s) {
        setRoles([]);
        setLoading(false);
        return;
      }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", s.user.id);
      if (!active) return;
      setRoles((data ?? []).map((r) => r.role as AppRole));
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => load(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      void load(s);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const isCounsellor = roles.includes("counsellor");
  return {
    session,
    user: session?.user ?? null,
    roles,
    loading,
    isCounsellor,
    isAdmin: roles.includes("admin"),
    isStudent: roles.includes("student") || (!isCounsellor && roles.length === 0),
  };
}