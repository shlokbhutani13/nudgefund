import {
  createContext,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import type { DecisionRepository } from "@/data/DecisionRepository";
import type { ProfileRepository } from "@/data/ProfileRepository";
import { createRepositories } from "@/data/repositoryFactory";
import { SupabaseCoach } from "@/features/coaching/SupabaseCoach";
import type { FinancialCoach } from "@/features/coaching/contracts";
import { createDeterministicCoach } from "@/features/coaching/deterministicCoach";
import { useAuth } from "./AuthContext";
import { persistentStorage } from "./storage";
import { supabase } from "./supabaseClient";

export type AppServices = {
  decisions: DecisionRepository;
  profiles: ProfileRepository;
  coach: FinancialCoach;
};

const AppServicesContext =
  createContext<AppServices | null>(null);

export function useAppServices() {
  const services = useContext(AppServicesContext);
  if (!services) {
    throw new Error(
      "Application services are unavailable while signed out.",
    );
  }
  return services;
}

export function AppServicesProvider({
  children,
}: PropsWithChildren) {
  const { mode } = useAuth();

  const services = useMemo<AppServices | null>(() => {
    if (mode === "signed-out") {
      return null;
    }

    const repositories = createRepositories({
      mode,
      storage: persistentStorage,
      supabase,
    });
    const coach =
      mode === "connected" && supabase
        ? new SupabaseCoach(supabase)
        : createDeterministicCoach();

    return {
      ...repositories,
      coach,
    };
  }, [mode]);

  return (
    <AppServicesContext.Provider value={services}>
      {children}
    </AppServicesContext.Provider>
  );
}
