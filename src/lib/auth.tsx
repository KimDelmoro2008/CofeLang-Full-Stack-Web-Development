import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = { session: Session | null; isStaff: boolean; ready: boolean };
const AuthContext = createContext<AuthState>({ session: null, isStaff: false, ready: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ session: null, isStaff: false, ready: false });

  useEffect(() => {
    let active = true;
    const load = async (session: Session | null) => {
      let isStaff = false;
      if (session) {
        const { data } = await supabase
          .from("user_roles").select("role").eq("user_id", session.user.id).eq("role", "staff").maybeSingle();
        isStaff = !!data;
      }
      if (active) setState({ session, isStaff, ready: true });
    };
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setTimeout(() => load(session), 0);
    });
    supabase.auth.getSession().then(({ data }) => load(data.session));
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
