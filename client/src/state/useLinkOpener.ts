import type { MouseEvent } from "react";
import { useSettings } from "./useSettings";
import { useReaderUI } from "./ReaderContext";

export function useLinkOpener() {
  const { settings } = useSettings();
  const { openLinkPane } = useReaderUI();
  const useReadingPane = settings?.openLinksIn === "readingPane";

  function handleLinkClick(e: MouseEvent, url: string, title?: string) {
    // Let modified clicks (open in new tab / new window / middle click) through untouched.
    if (!useReadingPane || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    e.preventDefault();
    openLinkPane({ url, title });
  }

  return { useReadingPane, handleLinkClick };
}
