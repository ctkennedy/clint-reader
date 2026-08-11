import { useEffect, useState } from "react";
import "./linkPane.css";

export function LinkPane({ url, title, onClose }: { url: string; title?: string; onClose: () => void }) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [url]);

  return (
    <div className="link-pane-backdrop" onClick={onClose}>
      <div className="link-pane" onClick={(e) => e.stopPropagation()}>
        <div className="link-pane-header">
          <div className="link-pane-heading">
            <span className="link-pane-title">{title || "Reading pane"}</span>
            <span className="link-pane-url">{url}</span>
          </div>
          <div className="link-pane-actions">
            <a href={url} target="_blank" rel="noopener noreferrer" className="button-link">
              Open in new tab ↗
            </a>
            <button onClick={onClose} title="Close (Esc)">
              ✕
            </button>
          </div>
        </div>
        <div className="link-pane-body">
          {!loaded && <div className="link-pane-loading">Loading…</div>}
          <iframe
            src={url}
            title={title || url}
            onLoad={() => setLoaded(true)}
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
            referrerPolicy="no-referrer"
          />
        </div>
        <p className="link-pane-hint">
          Some sites block embedding in a reading pane. If this looks empty or broken, use "Open in new tab" above.
        </p>
      </div>
    </div>
  );
}
