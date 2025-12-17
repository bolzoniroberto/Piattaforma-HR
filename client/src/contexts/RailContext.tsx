import { createContext, useContext, useState, ReactNode } from 'react';

interface RailContextType {
  isRailOpen: boolean;
  toggleRail: () => void;
  setIsRailOpen: (open: boolean) => void;
  activeSection: string | null;
  setActiveSection: (sectionId: string | null) => void;
  isPanelOpen: boolean;
  togglePanel: () => void;
  setIsPanelOpen: (open: boolean) => void;
  // Actions Panel (sidebar destra)
  isActionsPanelOpen: boolean;
  toggleActionsPanel: () => void;
  setIsActionsPanelOpen: (open: boolean) => void;
}

const RailContext = createContext<RailContextType | undefined>(undefined);

export function RailProvider({ children }: { children: ReactNode }) {
  const [isRailOpen, setIsRailOpen] = useState(true); // Default open on desktop
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(true); // Panel open by default
  const [isActionsPanelOpen, setIsActionsPanelOpen] = useState(true); // Default open for admin

  const toggleRail = () => setIsRailOpen((prev) => !prev);
  const togglePanel = () => setIsPanelOpen((prev) => !prev);
  const toggleActionsPanel = () => setIsActionsPanelOpen((prev) => !prev);

  return (
    <RailContext.Provider value={{
      isRailOpen,
      toggleRail,
      setIsRailOpen,
      activeSection,
      setActiveSection,
      isPanelOpen,
      togglePanel,
      setIsPanelOpen,
      isActionsPanelOpen,
      toggleActionsPanel,
      setIsActionsPanelOpen
    }}>
      {children}
    </RailContext.Provider>
  );
}

export function useRail() {
  const context = useContext(RailContext);
  if (!context) {
    throw new Error('useRail must be used within a RailProvider');
  }
  return context;
}
