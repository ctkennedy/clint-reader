import DOMPurify from "dompurify";
import { useMemo } from "react";

DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export function ArticleContent({ html }: { html: string }) {
  const clean = useMemo(
    () =>
      DOMPurify.sanitize(html, {
        FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
        FORBID_ATTR: ["style"],
        ADD_ATTR: ["target", "rel"],
      }),
    [html]
  );

  return <div className="article-content" dangerouslySetInnerHTML={{ __html: clean }} />;
}
