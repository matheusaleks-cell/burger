
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type AppRole = "admin" | "attendant" | "kitchen";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  fullName: string | null;
  username: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  createUser: (username: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
  isAdmin: boolean;
  isAttendant: boolean;
  isKitchen: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    try {
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .single();

      if (roleData) {
        setRole(roleData.role as AppRole);
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, username")
        .eq("id", userId)
        .single();

      if (profileData) {
        setFullName(profileData.full_name);
        setUsername(profileData.username);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          fetchUserData(session.user.id);
        } else {
          setRole(null);
          setFullName(null);
          setUsername(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserData(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const createUser = async (username: string, password: string, fullName: string, role: AppRole) => {
    // Create user with username as email (username@pousadamanager.local)
    const email = `${username.toLowerCase()}@pousadamanager.local`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      return { error };
    }

    // Update the role if not admin (since first user is auto-admin)
    if (data.user && role !== "attendant") {
      await supabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", data.user.id);
    }

    return { error: null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    toast.success("Logout realizado com sucesso!");
  };

  const value = {
    user,
    session,
    role,
    fullName,
    username,
    loading,
    signIn,
    signOut,
    createUser,
    isAdmin: role === "admin",
    isAttendant: role === "attendant",
    isKitchen: role === "kitchen",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
