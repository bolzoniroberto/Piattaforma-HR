import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";

export interface FeatureFlags {
  gestione_anagrafiche_admin: boolean;
  gestione_anagrafiche_user: boolean;
  gestione_mbo_admin: boolean;
  gestione_mbo_user: boolean;
  performance_management_admin: boolean;
  performance_management_user: boolean;
  gestione_organizzazione_admin: boolean;
  gestione_organizzazione_user: boolean;
}

const DEFAULTS: FeatureFlags = {
  gestione_anagrafiche_admin: true,
  gestione_anagrafiche_user: false,
  gestione_mbo_admin: true,
  gestione_mbo_user: true,
  performance_management_admin: true,
  performance_management_user: true,
  gestione_organizzazione_admin: false,
  gestione_organizzazione_user: true,
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
