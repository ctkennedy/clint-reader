import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../api/client";
import type { Feed, Folder } from "../../api/types";
import "./sidebar.css";

function formatUnread(n: number): string {
  if (n <= 0) return "";
  if (n > 1000) return "1000+";
  return String(n);
}

export function Sidebar({ activeScope, onSelectScope }: { activeScope: string; onSelectScope: (scope: string) => void }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const feedsQuery = useQuery({ queryKey: ["feeds"], queryFn: api.listFeeds, refetchInterval: 60_000 });
  const foldersQuery = useQuery({ queryKey: ["folders"], queryFn: api.listFolders });
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());
  const [dragFeedId, setDragFeedId] = useState<string | null>(null);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState("");

  const feeds = feedsQuery.data || [];
  const folders = foldersQuery.data || [];

  const moveFeedMutation = useMutation({
    mutationFn: ({ feedId, folderIds }: { feedId: string; folderIds: string[] }) =>
      api.updateFeed(feedId, { folderIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
    },
  });

  const createFolderMutation = useMutation({
    mutationFn: (name: string) => api.createFolder(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setNewFolderName("");
      setNewFolderOpen(false);
    },
  });

  const renameFolderMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) => api.renameFolder(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      setEditingFolderId(null);
    },
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (id: string) => api.deleteFolder(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      if (activeScope === `folder:${id}`) navigate("/?stream=all");
    },
  });

  const unsubscribeMutation = useMutation({
    mutationFn: (id: string) => api.unsubscribe(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ["feeds"] });
      queryClient.invalidateQueries({ queryKey: ["folders"] });
      if (activeScope === `feed:${id}`) navigate("/?stream=all");
    },
  });

  const totals = useMemo(() => {
    const totalUnread = feeds.reduce((sum, f) => sum + (f.unreadCount || 0), 0);
    return { totalUnread };
  }, [feeds]);

  const feedsById = useMemo(() => new Map(feeds.map((f) => [f.id, f])), [feeds]);
  const unfiledFeeds = feeds.filter((f) => !f.folders || f.folders.length === 0);

  function feedsInFolder(folderId: string): Feed[] {
    return feeds.filter((f) => f.folders?.some((ff) => ff.folderId === folderId));
  }

  function folderUnread(folderId: string): number {
    return feedsInFolder(folderId).reduce((sum, f) => sum + (f.unreadCount || 0), 0);
  }

  function toggleFolder(id: string) {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function startRenameFolder(folder: Folder) {
    setEditingFolderId(folder.id);
    setEditingFolderName(folder.name);
  }

  function submitRenameFolder(folderId: string) {
    const name = editingFolderName.trim();
    if (!name) {
      setEditingFolderId(null);
      return;
    }
    renameFolderMutation.mutate({ id: folderId, name });
  }

  function handleDeleteFolder(folder: Folder) {
    const feedCount = feedsInFolder(folder.id).length;
    const message =
      feedCount > 0
        ? `Delete "${folder.name}"? Its ${feedCount} feed${feedCount === 1 ? "" : "s"} will move to "Not in a folder" — they won't be unsubscribed.`
        : `Delete the empty folder "${folder.name}"?`;
    if (window.confirm(message)) deleteFolderMutation.mutate(folder.id);
  }

  function handleUnsubscribe(feed: Feed) {
    const name = feed.customTitle || feed.title;
    if (window.confirm(`Unsubscribe from "${name}"? This deletes all of its saved items and can't be undone.`)) {
      unsubscribeMutation.mutate(feed.id);
    }
  }

  function handleDrop(folderId: string) {
    if (!dragFeedId) return;
    const feed = feedsById.get(dragFeedId);
    if (!feed) return;
    const existingFolderIds = (feed.folders || []).map((ff) => ff.folderId);
    if (existingFolderIds.includes(folderId)) {
      setDragFeedId(null);
      return;
    }
    moveFeedMutation.mutate({ feedId: dragFeedId, folderIds: [...existingFolderIds, folderId] });
    setDragFeedId(null);
  }

  function renderFeedRow(feed: Feed) {
    const scope = `feed:${feed.id}`;
    return (
      <li
        key={feed.id}
        draggable
        onDragStart={() => setDragFeedId(feed.id)}
        onDragEnd={() => setDragFeedId(null)}
        className={`feed-row ${activeScope === scope ? "active" : ""}`}
      >
        <button className="feed-link" onClick={() => onSelectScope(scope)} title={feed.title}>
          {feed.faviconUrl ? <img className="favicon" src={feed.faviconUrl} alt="" /> : <span className="favicon-placeholder" />}
          <span className="feed-title">{feed.customTitle || feed.title}</span>
          {feed.unreadCount ? <span className="unread-badge">{formatUnread(feed.unreadCount)}</span> : null}
        </button>
        <button
          className="row-action-btn"
          title="Unsubscribe"
          onClick={(e) => {
            e.stopPropagation();
            handleUnsubscribe(feed);
          }}
        >
          ✕
        </button>
      </li>
    );
  }

  return (
    <nav className="sidebar">
      <div className="sidebar-header">
        <Link to="/" className="brand">
          Clint Reader
        </Link>
      </div>

      <button className="subscribe-btn" onClick={() => onSelectScope("__subscribe__")}>
        + Subscribe
      </button>

      <ul className="smart-views">
        <li className={activeScope === "all" ? "active" : ""}>
          <button onClick={() => onSelectScope("all")}>
            <span className="icon">📰</span> All items
            {totals.totalUnread ? <span className="unread-badge">{formatUnread(totals.totalUnread)}</span> : null}
          </button>
        </li>
        <li className={activeScope === "starred" ? "active" : ""}>
          <button onClick={() => onSelectScope("starred")}>
            <span className="icon">★</span> Starred items
          </button>
        </li>
        <li className={activeScope === "shared" ? "active" : ""}>
          <button onClick={() => onSelectScope("shared")}>
            <span className="icon">↗</span> Shared items
          </button>
        </li>
      </ul>

      <div className="section-label">
        <span>Subscriptions</span>
        <button className="add-folder-btn" title="New folder" onClick={() => setNewFolderOpen((v) => !v)}>
          +
        </button>
      </div>

      {newFolderOpen && (
        <form
          className="new-folder-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (newFolderName.trim()) createFolderMutation.mutate(newFolderName.trim());
          }}
        >
          <input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Folder name"
          />
        </form>
      )}

      <ul className="folder-tree">
        {folders.map((folder: Folder) => {
          const collapsed = collapsedFolders.has(folder.id);
          const unread = folderUnread(folder.id);
          const scope = `folder:${folder.id}`;
          const isEditing = editingFolderId === folder.id;
          return (
            <li
              key={folder.id}
              className="folder-node"
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(folder.id)}
            >
              <div className={`folder-row ${activeScope === scope ? "active" : ""}`}>
                <button className="collapse-toggle" onClick={() => toggleFolder(folder.id)}>
                  {collapsed ? "▸" : "▾"}
                </button>
                {isEditing ? (
                  <form
                    className="rename-folder-form"
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitRenameFolder(folder.id);
                    }}
                  >
                    <input
                      autoFocus
                      value={editingFolderName}
                      onChange={(e) => setEditingFolderName(e.target.value)}
                      onBlur={() => submitRenameFolder(folder.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Escape") setEditingFolderId(null);
                      }}
                    />
                  </form>
                ) : (
                  <>
                    <button className="folder-link" onClick={() => onSelectScope(scope)}>
                      <span className="folder-name">{folder.name}</span>
                      {unread ? <span className="unread-badge">{formatUnread(unread)}</span> : null}
                    </button>
                    <button
                      className="row-action-btn"
                      title="Rename folder"
                      onClick={(e) => {
                        e.stopPropagation();
                        startRenameFolder(folder);
                      }}
                    >
                      ✎
                    </button>
                    <button
                      className="row-action-btn"
                      title="Delete folder"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder);
                      }}
                    >
                      ✕
                    </button>
                  </>
                )}
              </div>
              {!collapsed && <ul className="feed-list">{feedsInFolder(folder.id).map(renderFeedRow)}</ul>}
            </li>
          );
        })}

        {unfiledFeeds.length > 0 && (
          <li
            className="folder-node unfiled"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              // Dropping on "unfiled" root removes folder assignment
              if (!dragFeedId) return;
              moveFeedMutation.mutate({ feedId: dragFeedId, folderIds: [] });
              setDragFeedId(null);
            }}
          >
            <div className="folder-row unfiled-row">
              <span className="unfiled-label">Not in a folder</span>
            </div>
            <ul className="feed-list">{unfiledFeeds.map(renderFeedRow)}</ul>
          </li>
        )}
      </ul>

      {feeds.length === 0 && !feedsQuery.isLoading && (
        <p className="empty-hint">No subscriptions yet. Click "+ Subscribe" to add your first feed.</p>
      )}

      <div className="sidebar-footer">
        <button onClick={() => navigate("/trends")}>Trends</button>
        <button onClick={() => navigate("/settings")}>Settings</button>
      </div>
    </nav>
  );
}
