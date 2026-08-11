import { useEffect, useRef } from "react";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

interface GlobalHandlers {
  onToggleSidebar: () => void;
  onToggleHelp: () => void;
  onGoAll: () => void;
  onGoStarred: () => void;
  onEscape: () => void;
}

export function useGlobalShortcuts(handlers: GlobalHandlers) {
  const chordRef = useRef<{ key: string; time: number } | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        handlersRef.current.onEscape();
        return;
      }
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const chord = chordRef.current;
      const now = Date.now();
      if (chord && now - chord.time < 900) {
        chordRef.current = null;
        if (chord.key === "g" && e.key === "a") {
          e.preventDefault();
          handlersRef.current.onGoAll();
          return;
        }
        if (chord.key === "g" && e.key === "s") {
          e.preventDefault();
          handlersRef.current.onGoStarred();
          return;
        }
      }

      if (e.key === "g") {
        chordRef.current = { key: "g", time: now };
        return;
      }
      if (e.key === "u") {
        handlersRef.current.onToggleSidebar();
      } else if (e.key === "?") {
        handlersRef.current.onToggleHelp();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);
}

interface ReaderHandlers {
  onNext: () => void;
  onPrev: () => void;
  onOpen: () => void;
  onStar: () => void;
  onShare: () => void;
  onToggleRead: () => void;
  onMarkAllRead: () => void;
  onRefresh: () => void;
}

export function useReaderShortcuts(handlers: ReaderHandlers, enabled: boolean) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      switch (e.key) {
        case "j":
        case "n":
          e.preventDefault();
          handlersRef.current.onNext();
          break;
        case "k":
        case "p":
          e.preventDefault();
          handlersRef.current.onPrev();
          break;
        case "o":
        case "Enter":
          handlersRef.current.onOpen();
          break;
        case "s":
          handlersRef.current.onStar();
          break;
        case "S":
          handlersRef.current.onShare();
          break;
        case "m":
          handlersRef.current.onToggleRead();
          break;
        case "A":
          handlersRef.current.onMarkAllRead();
          break;
        case "r":
          handlersRef.current.onRefresh();
          break;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
