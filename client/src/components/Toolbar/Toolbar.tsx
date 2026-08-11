import "./toolbar.css";

interface Props {
  title: string;
  unreadCount: number;
  viewMode: "list" | "expanded";
  sortOrder: "newest" | "oldest";
  onViewModeChange: (mode: "list" | "expanded") => void;
  onSortOrderChange: (order: "newest" | "oldest") => void;
  onMarkAllRead: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
}

export function Toolbar({
  title,
  unreadCount,
  viewMode,
  sortOrder,
  onViewModeChange,
  onSortOrderChange,
  onMarkAllRead,
  onRefresh,
  isRefreshing,
  searchValue,
  onSearchChange,
  onSearchSubmit,
}: Props) {
  return (
    <div className="toolbar">
      <div className="toolbar-title">
        <h1>{title}</h1>
        {unreadCount > 0 && <span className="toolbar-unread-count">{unreadCount} unread</span>}
      </div>

      <form
        className="search-box"
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit(searchValue);
        }}
      >
        <input
          type="search"
          placeholder="Search your subscriptions"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </form>

      <div className="toolbar-actions">
        <button onClick={onMarkAllRead} title="Mark all as read (Shift+A)">
          Mark all as read
        </button>
        <button onClick={onRefresh} disabled={isRefreshing} title="Refresh (r)">
          {isRefreshing ? "Refreshing…" : "Refresh"}
        </button>
        <div className="segmented">
          <button className={sortOrder === "newest" ? "active" : ""} onClick={() => onSortOrderChange("newest")}>
            Newest
          </button>
          <button className={sortOrder === "oldest" ? "active" : ""} onClick={() => onSortOrderChange("oldest")}>
            Oldest
          </button>
        </div>
        <div className="segmented">
          <button className={viewMode === "list" ? "active" : ""} onClick={() => onViewModeChange("list")} title="List view">
            List
          </button>
          <button
            className={viewMode === "expanded" ? "active" : ""}
            onClick={() => onViewModeChange("expanded")}
            title="Expanded view"
          >
            Expanded
          </button>
        </div>
      </div>
    </div>
  );
}
