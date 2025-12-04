import { createContext, useContext, useState, ReactNode } from 'react';

interface RailContextType {
  isRailOpen: boolean;
  toggleRail: () => void;
  setIsRailOpen: (open: boolean) => void;
}

const RailContext = createContext<RailContextType | undefined>(undefined);

export function RailProvider({ children }: { children: ReactNode }) {
  const [isRailOpen, setIsRailOpen] = useState(false);

  const toggleRail = () => setIsRailOpen((prev) => !prev);

  return (
    <RailContext.Provider value={{ isRailOpen, toggleRail, setIsRailOpen }}>
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
