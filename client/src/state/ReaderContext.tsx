import React, { createContext, useContext, useState, useCallback } from "react";

interface ReaderUIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
}

const ReaderContext = createContext<ReaderUIState | null>(null);

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), []);

  return (
    <ReaderContext.Provider
      value={{ sidebarCollapsed, toggleSidebar, selectedItemId, setSelectedItemId, helpOpen, setHelpOpen }}
    >
      {children}
    </ReaderContext.Provider>
  );
}

export function useReaderUI() {
  const ctx = useContext(ReaderContext);
  if (!ctx) throw new Error("useReaderUI must be used within ReaderProvider");
  return ctx;
}
