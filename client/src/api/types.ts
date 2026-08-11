export interface Folder {
  id: string;
  name: string;
  order: number;
  feeds: { feedId: string; folderId: string; feed: Feed }[];
}

export interface Feed {
  id: string;
  url: string;
  siteUrl: string | null;
  title: string;
  customTitle: string | null;
  faviconUrl: string | null;
  description: string | null;
  createdAt: string;
  lastFetchedAt: string | null;
  lastError: string | null;
  unreadCount?: number;
  folders?: { folderId: string; feedId: string; folder: Folder }[];
}

export interface ItemState {
  itemId: string;
  isRead: boolean;
  isStarred: boolean;
  isShared: boolean;
  isLiked: boolean;
  readAt: string | null;
  updatedAt: string;
}

export interface Item {
  id: string;
  feedId: string;
  guid: string;
  url: string | null;
  title: string;
  author: string | null;
  contentHtml: string | null;
  summary: string | null;
  publishedAt: string;
  fetchedAt: string;
  feed: Feed;
  state: ItemState | null;
}

export interface ItemsResponse {
  items: Item[];
  total: number;
  offset: number;
  limit: number;
}

export interface Settings {
  viewMode: "list" | "expanded";
  markReadBehavior: "scroll" | "open";
  sortOrder: "newest" | "oldest";
  itemsPerPage: string;
  theme: string;
}

export interface Trends {
  subscriptionCount: number;
  totalItems: number;
  totalRead: number;
  totalStarred: number;
  totalShared: number;
  readLast30: number;
  unreadNow: number;
  mostActiveFeeds: { feedId: string; title: string; readCount: number }[];
  dailyReadCounts: { day: string; count: number }[];
}

export type Scope = "all" | "starred" | "shared" | `feed:${string}` | `folder:${string}`;
