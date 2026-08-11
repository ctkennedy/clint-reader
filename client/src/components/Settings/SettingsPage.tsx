import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "../../api/client";
import { useSettings } from "../../state/useSettings";
import "./settings.css";

export function SettingsPage() {
  const { settings, updateSettings, isLoading } = useSettings();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importResult, setImportResult] = useState<string | null>(null);

  const importMutation = useMutation({
    mutationFn: (xml: string) => api.importOpml(xml),
    onSuccess: (result) => {
      setImportResult(`Imported ${result.imported} feed${result.imported === 1 ? "" : "s"}${result.failed ? `, ${result.failed} failed` : ""}.`);
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
    onError: (err: Error) => setImportResult(err.message),
  });

  function handleFilePicked(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => importMutation.mutate(String(reader.result));
    reader.readAsText(file);
    e.target.value = "";
  }

  if (isLoading || !settings) {
    return <div className="settings-page">Loading…</div>;
  }

  return (
    <div className="settings-page">
      <div className="settings-header">
        <Link to="/">&larr; Back to Reader</Link>
        <h1>Settings</h1>
      </div>

      <section>
        <h2>Reading preferences</h2>

        <label className="settings-row">
          <span>Default view</span>
          <select
            value={settings.viewMode}
            onChange={(e) => updateSettings({ viewMode: e.target.value as "list" | "expanded" })}
          >
            <option value="list">List view</option>
            <option value="expanded">Expanded view</option>
          </select>
        </label>

        <label className="settings-row">
          <span>Mark items as read</span>
          <select
            value={settings.markReadBehavior}
            onChange={(e) => updateSettings({ markReadBehavior: e.target.value as "scroll" | "open" })}
          >
            <option value="scroll">As I scroll past them</option>
            <option value="open">Only when I open them</option>
          </select>
        </label>

        <label className="settings-row">
          <span>Default sort order</span>
          <select
            value={settings.sortOrder}
            onChange={(e) => updateSettings({ sortOrder: e.target.value as "newest" | "oldest" })}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </label>

        <label className="settings-row">
          <span>Items per page</span>
          <select value={settings.itemsPerPage} onChange={(e) => updateSettings({ itemsPerPage: e.target.value })}>
            <option value="20">20</option>
            <option value="40">40</option>
            <option value="80">80</option>
          </select>
        </label>
      </section>

      <section>
        <h2>Import / Export</h2>
        <p className="settings-hint">
          Export your subscriptions as an OPML file, or import one from another reader (or a Google Takeout archive).
        </p>
        <div className="import-export-actions">
          <a className="button-link" href={api.exportOpmlUrl()}>
            Export subscriptions (OPML)
          </a>
          <button onClick={() => fileInputRef.current?.click()} disabled={importMutation.isPending}>
            {importMutation.isPending ? "Importing…" : "Import OPML file"}
          </button>
          <input ref={fileInputRef} type="file" accept=".opml,.xml" hidden onChange={handleFilePicked} />
        </div>
        {importResult && <p className="import-result">{importResult}</p>}
      </section>
    </div>
  );
}
