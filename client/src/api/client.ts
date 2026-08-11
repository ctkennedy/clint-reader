import type { Feed, Folder, Item, ItemsResponse, Settings, Trends } from "./types";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Feeds
  listFeeds: () => request<Feed[]>("/feeds"),
  subscribe: (url: string, folderIds: string[] = []) =>
    request<Feed>("/feeds", { method: "POST", body: JSON.stringify({ url, folderIds }) }),
  updateFeed: (id: string, data: { customTitle?: string; folderIds?: string[] }) =>
    request<Feed>(`/feeds/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  unsubscribe: (id: string) => request<void>(`/feeds/${id}`, { method: "DELETE" }),
  refreshFeed: (id: string) => request<{ newCount: number }>(`/feeds/${id}/refresh`, { method: "POST" }),

  // Folders
  listFolders: () => request<Folder[]>("/folders"),
  createFolder: (name: string) => request<Folder>("/folders", { method: "POST", body: JSON.stringify({ name }) }),
  renameFolder: (id: string, name: string) =>
    request<Folder>(`/folders/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  deleteFolder: (id: string) => request<void>(`/folders/${id}`, { method: "DELETE" }),

  // Items
  listItems: (params: { scope: string; sort?: string; unreadOnly?: boolean; offset?: number; limit?: number }) => {
    const qs = new URLSearchParams({
      scope: params.scope,
      sort: params.sort || "newest",
      unreadOnly: String(params.unreadOnly ?? false),
      offset: String(params.offset ?? 0),
      limit: String(params.limit ?? 40),
    });
    return request<ItemsResponse>(`/items?${qs}`);
  },
  markRead: (id: string) => request(`/items/${id}/read`, { method: "POST" }),
  markUnread: (id: string) => request(`/items/${id}/unread`, { method: "POST" }),
  star: (id: string) => request(`/items/${id}/star`, { method: "POST" }),
  unstar: (id: string) => request(`/items/${id}/unstar`, { method: "POST" }),
  share: (id: string) => request(`/items/${id}/share`, { method: "POST" }),
  unshare: (id: string) => request(`/items/${id}/unshare`, { method: "POST" }),
  like: (id: string) => request(`/items/${id}/like`, { method: "POST" }),
  unlike: (id: string) => request(`/items/${id}/unlike`, { method: "POST" }),
  markAllRead: (scope: string) => request<{ marked: number }>(`/items/mark-all-read?scope=${encodeURIComponent(scope)}`, { method: "POST" }),

  // Search
  search: (q: string) => request<{ items: Item[] }>(`/search?q=${encodeURIComponent(q)}`),

  // Stats
  trends: () => request<Trends>("/stats/trends"),

  // Settings
  getSettings: () => request<Settings>("/settings"),
  updateSettings: (data: Partial<Settings>) =>
    request<Settings>("/settings", { method: "PUT", body: JSON.stringify(data) }),

  // OPML
  exportOpmlUrl: () => `${BASE}/opml/export`,
  importOpml: (xml: string) => request<{ imported: number; failed: number }>("/opml/import", { method: "POST", body: JSON.stringify({ xml }) }),
};
