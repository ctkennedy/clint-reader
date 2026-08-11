import { useEffect, useRef } from "react";
import type { Item } from "../../api/types";
import { ArticleContent } from "../ReadingPane/ArticleContent";
import { useLinkOpener } from "../../state/useLinkOpener";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

interface Props {
  item: Item;
  viewMode: "list" | "expanded";
  isSelected: boolean;
  isExpanded: boolean;
  markOnScroll: boolean;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleRead: (item: Item) => void;
  onToggleStar: (item: Item) => void;
  onToggleShare: (item: Item) => void;
  onToggleLike: (item: Item) => void;
}

export function ItemRow({
  item,
  viewMode,
  isSelected,
  isExpanded,
  markOnScroll,
  onSelect,
  onToggleExpand,
  onToggleRead,
  onToggleStar,
  onToggleShare,
  onToggleLike,
}: Props) {
  const ref = useRef<HTMLLIElement>(null);
  const { handleLinkClick } = useLinkOpener();
  const isRead = item.state?.isRead ?? false;
  const isStarred = item.state?.isStarred ?? false;
  const isShared = item.state?.isShared ?? false;
  const isLiked = item.state?.isLiked ?? false;

  useEffect(() => {
    if (!markOnScroll || isRead || viewMode !== "expanded") return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onToggleRead(item);
          observer.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markOnScroll, isRead, viewMode]);

  const showContent = viewMode === "expanded" || isExpanded;

  function handleTitleClick(e: React.MouseEvent) {
    e.preventDefault();
    onSelect(item.id);
    if (viewMode === "list") {
      onToggleExpand(item.id);
      if (!isRead) onToggleRead(item);
    } else if (!isRead) {
      onToggleRead(item);
    }
  }

  return (
    <li
      ref={ref}
      id={`item-${item.id}`}
      className={`item-row ${isRead ? "read" : "unread"} ${isSelected ? "selected" : ""} ${viewMode}`}
      onClick={() => onSelect(item.id)}
    >
      <div className="item-row-header">
        <button
          className={`star-btn ${isStarred ? "active" : ""}`}
          title="Star (s)"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStar(item);
          }}
        >
          {isStarred ? "★" : "☆"}
        </button>
        {item.feed.faviconUrl && <img className="favicon" src={item.feed.faviconUrl} alt="" />}
        <span className="feed-name">{item.feed.customTitle || item.feed.title}</span>
        <a href={item.url ?? undefined} className="item-title" onClick={handleTitleClick}>
          {item.title}
        </a>
        <span className="item-date">{formatDate(item.publishedAt)}</span>
      </div>

      {!showContent && item.summary && <p className="item-summary">{item.summary.slice(0, 220)}</p>}

      {showContent && (
        <div className="item-body">
          <ArticleContent html={item.contentHtml || item.summary || ""} />
          <div className="item-actions">
            <button onClick={() => onToggleRead(item)}>{isRead ? "Mark unread" : "Mark read"}</button>
            <button className={isStarred ? "active" : ""} onClick={() => onToggleStar(item)}>
              {isStarred ? "★ Starred" : "☆ Star"}
            </button>
            <button className={isShared ? "active" : ""} onClick={() => onToggleShare(item)}>
              {isShared ? "↗ Shared" : "↗ Share"}
            </button>
            <button className={isLiked ? "active" : ""} onClick={() => onToggleLike(item)}>
              {isLiked ? "👍 Liked" : "👍 Like"}
            </button>
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="open-original"
                onClick={(e) => handleLinkClick(e, item.url!, item.title)}
              >
                View original ↗
              </a>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
