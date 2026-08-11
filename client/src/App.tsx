import { useState } from "react";
import { Routes, Route, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { ReaderProvider, useReaderUI } from "./state/ReaderContext";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ReaderView } from "./components/ReaderView/ReaderView";
import { TrendsPage } from "./components/Trends/TrendsPage";
import { SettingsPage } from "./components/Settings/SettingsPage";
import { AddSubscriptionModal } from "./components/AddSubscription/AddSubscriptionModal";
import { HelpOverlay } from "./components/KeyboardShortcuts/HelpOverlay";
import { LinkPane } from "./components/ReadingPane/LinkPane";
import { useGlobalShortcuts } from "./components/KeyboardShortcuts/useKeyboardShortcuts";

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sidebarCollapsed, toggleSidebar, helpOpen, setHelpOpen, linkPaneTarget, closeLinkPane } = useReaderUI();
  const [modalOpen, setModalOpen] = useState(false);

  const activeScope = location.pathname === "/" ? searchParams.get("stream") || "all" : "";

  function handleSelectScope(scope: string) {
    if (scope === "__subscribe__") {
      setModalOpen(true);
      return;
    }
    navigate(`/?stream=${encodeURIComponent(scope)}`);
  }

  useGlobalShortcuts({
    onToggleSidebar: toggleSidebar,
    onToggleHelp: () => setHelpOpen(!helpOpen),
    onGoAll: () => navigate("/?stream=all"),
    onGoStarred: () => navigate("/?stream=starred"),
    onEscape: () => {
      setModalOpen(false);
      setHelpOpen(false);
      closeLinkPane();
    },
  });

  return (
    <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {!sidebarCollapsed && <Sidebar activeScope={activeScope} onSelectScope={handleSelectScope} />}
      <main className="app-main">
        <Routes>
          <Route path="/" element={<ReaderView />} />
          <Route path="/trends" element={<TrendsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>

      {modalOpen && (
        <AddSubscriptionModal
          onClose={() => setModalOpen(false)}
          onSubscribed={(feedScope) => navigate(`/?stream=${encodeURIComponent(feedScope)}`)}
        />
      )}
      {helpOpen && <HelpOverlay onClose={() => setHelpOpen(false)} />}
      {linkPaneTarget && (
        <LinkPane url={linkPaneTarget.url} title={linkPaneTarget.title} onClose={closeLinkPane} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ReaderProvider>
      <AppShell />
    </ReaderProvider>
  );
}
