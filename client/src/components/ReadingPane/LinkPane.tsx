import { useEffect, useRef, useState } from "react";
import { api } from "../../api/client";
import "./linkPane.css";

// A blocked cross-origin iframe navigation fails silently at the browser/network
// level — Chrome still fires `load` on the frame almost instantly regardless of
// whether the content actually rendered, so that event can't tell loaded apart
// from blocked. The server checks the target's actual X-Frame-Options/CSP
// headers before we ever attempt to embed it, which is the only reliable signal.
const SLOW_LOAD_TIMEOUT_MS = 8000;

type Status = "checking" | "loading" | "loaded" | "blocked";

export function LinkPane({ url, title, onClose }: { url: string; title?: string; onClose: () => void }) {
  const [status, setStatus] = useState<Status>("checking");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("checking");

    api
      .checkEmbeddable(url)
      .then((result) => {
        if (cancelled) return;
        setStatus(result.embeddable ? "loading" : "blocked");
      })
      .catch(() => {
        if (!cancelled) setStatus("loading");
      });

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [url]);

  useEffect(() => {
    if (status !== "loading") return;
    timeoutRef.current = setTimeout(() => setStatus((s) => (s === "loading" ? "loaded" : s)), SLOW_LOAD_TIMEOUT_MS);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [status]);

  function handleLoad() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStatus((s) => (s === "loading" ? "loaded" : s));
  }

  return (
    <div className="link-pane-backdrop" onClick={onClose}>
      <div className="link-pane" onClick={(e) => e.stopPropagation()}>
        <div className="link-pane-header">
          <div className="link-pane-heading">
            <span className="link-pane-title">{title || "Reading pane"}</span>
            <span className="link-pane-url">{url}</span>
          </div>
          <div className="link-pane-actions">
            <a href={url} target="_blank" rel="noopener noreferrer" className="button-link" onClick={onClose}>
              Open in new tab ↗
            </a>
            <button onClick={onClose} title="Close (Esc)">
              ✕
            </button>
          </div>
        </div>
        <div className="link-pane-body">
          {(status === "checking" || status === "loading") && (
            <div className="link-pane-loading">{status === "checking" ? "Checking…" : "Loading…"}</div>
          )}
          {status === "blocked" && (
            <div className="link-pane-blocked">
              <p className="link-pane-blocked-title">This site can't be shown here</p>
              <p className="link-pane-blocked-detail">
                It's blocking embedding for security reasons (most news and social sites do this) — that's a
                setting on their end a reading pane can't get around.
              </p>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="button-link link-pane-blocked-cta"
                onClick={onClose}
              >
                Open in new tab ↗
              </a>
            </div>
          )}
          {status !== "blocked" && status !== "checking" && (
            <iframe
              key={url}
              src={url}
              title={title || url}
              onLoad={handleLoad}
              sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
        {status !== "blocked" && (
          <p className="link-pane-hint">
            Some sites block embedding in a reading pane. If this looks empty or broken, use "Open in new tab" above.
          </p>
        )}
      </div>
    </div>
  );
}
