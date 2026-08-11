import DOMPurify from "dompurify";
import { useMemo } from "react";
import { useLinkOpener } from "../../state/useLinkOpener";

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export function ArticleContent({ html }: { html: string }) {
  const { handleLinkClick } = useLinkOpener();

  const clean = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
        FORBID_ATTR: ["style"],
        ADD_ATTR: ["target", "rel"],
      }),
    [html]
  );

  // Links are injected via dangerouslySetInnerHTML, so a plain React onClick can't
  // attach to them individually — delegate from the wrapping div instead.
  function handleClick(e: React.MouseEvent<HTMLDivElement>) {
    const anchor = (e.target as HTMLElement).closest("a");
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href) return;
    handleLinkClick(e, href, anchor.textContent || undefined);
  }

  return <div className="article-content" onClick={handleClick} dangerouslySetInnerHTML={{ __html: clean }} />;
}
