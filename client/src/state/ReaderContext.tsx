import React, { createContext, useContext, useState, useCallback } from "react";

interface LinkPaneTarget {
  url: string;
  title?: string;
}

interface ReaderUIState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  helpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
  linkPaneTarget: LinkPaneTarget | null;
  openLinkPane: (target: LinkPaneTarget) => void;
  closeLinkPane: () => void;
}

const ReaderContext = createContext<ReaderUIState | null>(null);

export function ReaderProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [linkPaneTarget, setLinkPaneTarget] = useState<LinkPaneTarget | null>(null);

  const toggleSidebar = useCallback(() => setSidebarCollapsed((v) => !v), []);
  const openLinkPane = useCallback((target: LinkPaneTarget) => setLinkPaneTarget(target), []);
  const closeLinkPane = useCallback(() => setLinkPaneTarget(null), []);

  return (
    <ReaderContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar,
        selectedItemId,
        setSelectedItemId,
        helpOpen,
        setHelpOpen,
        linkPaneTarget,
        openLinkPane,
        closeLinkPane,
      }}
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
