import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { api } from "../../api/client";
import type { Item, ItemsResponse } from "../../api/types";
import { useSettings } from "../../state/useSettings";
import { useItemActions } from "../../state/useItemActions";
import { useReaderUI } from "../../state/ReaderContext";
import { Toolbar } from "../Toolbar/Toolbar";
import { ItemList } from "../ItemList/ItemList";
import { useReaderShortcuts } from "../KeyboardShortcuts/useKeyboardShortcuts";

function scopeTitle(scope: string, feeds: { id: string; title: string; customTitle: string | null }[], folders: { id: string; name: string }[]): string {
  if (scope === "all") return "All items";
  if (scope === "starred") return "Starred items";
  if (scope === "shared") return "Shared items";
  if (scope.startsWith("feed:")) {
    const feed = feeds.find((f) => f.id === scope.slice(5));
    return feed ? feed.customTitle || feed.title : "Feed";
  }
  if (scope.startsWith("folder:")) {
    const folder = folders.find((f) => f.id === scope.slice(7));
    return folder ? folder.name : "Folder";
  }
  return "Clint Reader";
}

export function ReaderView() {
  const [searchParams] = useSearchParams();
  const scope = searchParams.get("stream") || "all";
  const queryClient = useQueryClient();
  const { settings, updateSettings } = useSettings();
  const { selectedItemId, setSelectedItemId } = useReaderUI();
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  const sortOrder = (settings?.sortOrder as "newest" | "oldest") || "newest";
  const viewMode = (settings?.viewMode as "list" | "expanded") || "list";
  const markOnScroll = settings?.markReadBehavior === "scroll";
  const limit = Number(settings?.itemsPerPage) || 40;

  const feedsQuery = useQuery({ queryKey: ["feeds"], queryFn: api.listFeeds });
  const foldersQuery = useQuery({ queryKey: ["folders"], queryFn: api.listFolders });

  const itemsQuery = useInfiniteQuery({
    queryKey: ["items", scope, sortOrder, limit],
    queryFn: ({ pageParam }) => api.listItems({ scope, sort: sortOrder, offset: pageParam as number, limit }),
    initialPageParam: 0,
    getNextPageParam: (lastPage: ItemsResponse) =>
      lastPage.offset + lastPage.items.length < lastPage.total ? lastPage.offset + lastPage.limit : undefined,
  });

  const items = useMemo(() => itemsQuery.data?.pages.flatMap((p) => p.items) ?? [], [itemsQuery.data]);

  useEffect(() => {
    setExpandedItemId(null);
    setSelectedItemId(null);
  }, [scope, setSelectedItemId]);

  const actions = useItemActions();

  const markAllReadMutation = useMutation({
    mutationFn: () => api.markAllRead(scope),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", scope] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (scope.startsWith("feed:")) {
        await api.refreshFeed(scope.slice(5));
      } else {
        await Promise.allSettled((feedsQuery.data || []).map((f) => api.refreshFeed(f.id)));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items"] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
    },
  });

  const searchQuery = useQuery({
    queryKey: ["search", searchInput],
    queryFn: () => api.search(searchInput),
    enabled: searchInput.trim().length > 1,
  });

  const displayedItems = searchInput.trim().length > 1 ? searchQuery.data?.items ?? [] : items;

  function selectByOffset(delta: number) {
    if (displayedItems.length === 0) return;
    const currentIndex = displayedItems.findIndex((i) => i.id === selectedItemId);
    const nextIndex = Math.min(Math.max(currentIndex + delta, 0), displayedItems.length - 1);
    const next = displayedItems[currentIndex === -1 && delta > 0 ? 0 : nextIndex];
    if (next) {
      setSelectedItemId(next.id);
      document.getElementById(`item-${next.id}`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  const selectedItem = displayedItems.find((i) => i.id === selectedItemId) || null;

  useReaderShortcuts(
    {
      onNext: () => selectByOffset(1),
      onPrev: () => selectByOffset(-1),
      onOpen: () => {
        if (!selectedItem) return;
        if (viewMode === "list") setExpandedItemId((cur) => (cur === selectedItem.id ? null : selectedItem.id));
        if (!selectedItem.state?.isRead) actions.markRead(selectedItem.id);
      },
      onStar: () => selectedItem && actions.toggleStar(selectedItem),
      onShare: () => selectedItem && actions.toggleShare(selectedItem),
      onToggleRead: () => selectedItem && actions.toggleRead(selectedItem),
      onMarkAllRead: () => markAllReadMutation.mutate(),
      onRefresh: () => refreshMutation.mutate(),
    },
    true
  );

  const title = searchInput.trim().length > 1
    ? `Search: "${searchInput}"`
    : scopeTitle(scope, feedsQuery.data || [], foldersQuery.data || []);

  const unreadCount = useMemo(() => items.filter((i) => !i.state?.isRead).length, [items]);

  return (
    <div className="reader-view">
      <Toolbar
        title={title}
        unreadCount={unreadCount}
        viewMode={viewMode}
        sortOrder={sortOrder}
        onViewModeChange={(mode) => updateSettings({ viewMode: mode })}
        onSortOrderChange={(order) => updateSettings({ sortOrder: order })}
        onMarkAllRead={() => markAllReadMutation.mutate()}
        onRefresh={() => refreshMutation.mutate()}
        isRefreshing={refreshMutation.isPending}
        searchValue={searchInput}
        onSearchChange={setSearchInput}
        onSearchSubmit={setSearchInput}
      />

      <ItemList
        items={displayedItems}
        viewMode={viewMode}
        selectedItemId={selectedItemId}
        expandedItemId={expandedItemId}
        markOnScroll={markOnScroll}
        isLoading={itemsQuery.isLoading}
        hasMore={!!itemsQuery.hasNextPage}
        onLoadMore={() => itemsQuery.fetchNextPage()}
        onSelect={setSelectedItemId}
        onToggleExpand={(id) => setExpandedItemId((cur) => (cur === id ? null : id))}
        onToggleRead={actions.toggleRead}
        onToggleStar={actions.toggleStar}
        onToggleShare={actions.toggleShare}
        onToggleLike={actions.toggleLike}
      />
    </div>
  );
}
