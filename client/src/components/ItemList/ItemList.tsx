import { useEffect, useRef } from "react";
import type { Item } from "../../api/types";
import { ItemRow } from "./ItemRow";
import "./itemlist.css";

interface Props {
  items: Item[];
  viewMode: "list" | "expanded";
  selectedItemId: string | null;
  expandedItemId: string | null;
  markOnScroll: boolean;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onSelect: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleRead: (item: Item) => void;
  onToggleStar: (item: Item) => void;
  onToggleShare: (item: Item) => void;
  onToggleLike: (item: Item) => void;
}

export function ItemList({
  items,
  viewMode,
  selectedItemId,
  expandedItemId,
  markOnScroll,
  isLoading,
  hasMore,
  onLoadMore,
  onSelect,
  onToggleExpand,
  onToggleRead,
  onToggleStar,
  onToggleShare,
  onToggleLike,
}: Props) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el || !hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onLoadMore();
      },
      { rootMargin: "600px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, onLoadMore]);

  if (!isLoading && items.length === 0) {
    return <div className="item-list-empty">No items here. Nice and clean.</div>;
  }

  return (
    <ul className={`item-list ${viewMode}`}>
      {items.map((item) => (
        <ItemRow
          key={item.id}
          item={item}
          viewMode={viewMode}
          isSelected={selectedItemId === item.id}
          isExpanded={expandedItemId === item.id}
          markOnScroll={markOnScroll}
          onSelect={onSelect}
          onToggleExpand={onToggleExpand}
          onToggleRead={onToggleRead}
          onToggleStar={onToggleStar}
          onToggleShare={onToggleShare}
          onToggleLike={onToggleLike}
        />
      ))}
      <div ref={sentinelRef} className="load-sentinel">
        {isLoading && <span>Loading…</span>}
      </div>
    </ul>
  );
}
