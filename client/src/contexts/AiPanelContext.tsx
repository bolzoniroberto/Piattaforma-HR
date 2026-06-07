import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface AiPanelCompetencyContext {
  name: string;
  description: string;
  category: string;
  currentRating?: number;
}

export interface AiPanelOptions {
  competencyContext?: AiPanelCompetencyContext;
  suggestedPrompts?: string[];
  contextLabel?: string;
  endpoint?: string;
  initialMessage?: string;
}

interface AiPanelContextValue {
  isOpen: boolean;
  options: AiPanelOptions;
  open: (opts?: AiPanelOptions) => void;
  close: () => void;
  clearOptions: () => void;
}

const AiPanelContext = createContext<AiPanelContextValue | null>(null);

export function AiPanelProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<AiPanelOptions>({});

  const open = useCallback((opts?: AiPanelOptions) => {
    if (opts) setOptions(opts);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);
  const clearOptions = useCallback(() => setOptions({}), []);

  return (
    <AiPanelContext.Provider value={{ isOpen, options, open, close, clearOptions }}>
      {children}
    </AiPanelContext.Provider>
  );
}

export function useAiPanel() {
  const ctx = useContext(AiPanelContext);
  if (!ctx) throw new Error("useAiPanel must be used within AiPanelProvider");
  return ctx;
}
