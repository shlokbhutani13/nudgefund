import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { getPublicConfig } from "./config";
import { persistentStorage } from "./storage";
import { supabase } from "./supabaseClient";

export type AppMode = "signed-out" | "connected" | "demo";

type AuthResult = { error?: string };

type AuthContextType = {
  mode: AppMode;
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  connectedModeAvailable: boolean;
  enterDemo(): void;
  exitDemo(): void;
  signIn(email: string, password: string): Promise<AuthResult>;
  signUp(email: string, password: string): Promise<AuthResult>;
  resetPassword(email: string): Promise<AuthResult>;
  signOut(): Promise<void>;
};

const modeKey = "nudgefund:mode";
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<AppMode>("signed-out");
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const demoModeRef = useRef(false);
  const { connectedModeAvailable } = getPublicConfig();

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const storedMode = await persistentStorage.getItem(modeKey);
      if (!active) return;

      if (storedMode === "demo") {
        demoModeRef.current = true;
        setMode("demo");
        setIsLoading(false);
        return;
      }

      if (!supabase) {
        setMode("signed-out");
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error || !data.session) {
        setSession(null);
        setUser(null);
        setMode("signed-out");
      } else {
        setSession(data.session);
        setUser(data.session.user);
        setMode("connected");
      }
      setIsLoading(false);
    };

    void initialize();

    const authSubscription = supabase?.auth.onAuthStateChange(
      (_event, nextSession) => {
        if (!active || demoModeRef.current) return;
        setSession(nextSession);
        setUser(nextSession?.user ?? null);
        setMode(nextSession ? "connected" : "signed-out");
        setIsLoading(false);
      },
    );

    return () => {
      active = false;
      authSubscription?.data.subscription.unsubscribe();
    };
  }, []);

  const enterDemo = () => {
    demoModeRef.current = true;
    setSession(null);
    setUser(null);
    setMode("demo");
    void persistentStorage.setItem(modeKey, "demo");
  };

  const exitDemo = () => {
    demoModeRef.current = false;
    setMode("signed-out");
    void persistentStorage.removeItem(modeKey);
  };

  const signIn = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    if (!supabase) return { error: "Connected mode is unavailable." };
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) return { error: error.message };

    demoModeRef.current = false;
    await persistentStorage.removeItem(modeKey);
    setSession(data.session);
    setUser(data.user);
    setMode("connected");
    return {};
  };

  const signUp = async (
    email: string,
    password: string,
  ): Promise<AuthResult> => {
    if (!supabase) return { error: "Connected mode is unavailable." };
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    return error ? { error: error.message } : {};
  };

  const resetPassword = async (email: string): Promise<AuthResult> => {
    if (!supabase) return { error: "Connected mode is unavailable." };
    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
    );
    return error ? { error: error.message } : {};
  };

  const signOut = async () => {
    if (mode === "demo") {
      exitDemo();
      return;
    }
    await supabase?.auth.signOut();
    setSession(null);
    setUser(null);
    setMode("signed-out");
  };

  const value = useMemo<AuthContextType>(
    () => ({
      mode,
      session,
      user,
      isLoading,
      connectedModeAvailable,
      enterDemo,
      exitDemo,
      signIn,
      signUp,
      resetPassword,
      signOut,
    }),
    [
      connectedModeAvailable,
      isLoading,
      mode,
      session,
      user,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
