import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";

export interface FeatureFlags {
  gestione_anagrafiche: boolean;
  gestione_mbo: boolean;
  performance_management: boolean;
  gestione_organizzazione: boolean;
}

const DEFAULTS: FeatureFlags = {
  gestione_anagrafiche: true,
  gestione_mbo: true,
  performance_management: true,
  gestione_organizzazione: true,
};

const FeatureFlagsContext = createContext<FeatureFlags>(DEFAULTS);

export function FeatureFlagsProvider({ children }: { children: React.ReactNode }) {
  const { data } = useQuery<FeatureFlags>({
    queryKey: ["/api/settings/features"],
    staleTime: 30_000,
  });

  return (
    <FeatureFlagsContext.Provider value={data ?? DEFAULTS}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}
