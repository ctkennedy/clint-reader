import { useQueryClient, useMutation } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Item, ItemsResponse } from "../api/types";

type Patch = Partial<Item["state"]>;

export function useItemActions() {
  const queryClient = useQueryClient();

  function patchItemInCache(itemId: string, patch: Patch) {
    queryClient.setQueriesData<{ pages: ItemsResponse[]; pageParams: unknown[] } | undefined>(
      { queryKey: ["items"] },
      (data) => {
        if (!data) return data;
        return {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items.map((it) =>
              it.id === itemId
                ? { ...it, state: { ...(it.state as NonNullable<Item["state"]>), ...patch } }
                : it
            ),
          })),
        };
      }
    );
  }

  function invalidateCounts() {
    queryClient.invalidateQueries({ queryKey: ["feeds"] });
  }

  // Starring/sharing can move an item into or out of the "starred"/"shared" smart
  // views, which may already be cached without it. A same-scope optimistic patch
  // can't add a row to a differently-scoped list, so those two caches need a refetch.
  function invalidateSmartViews() {
    queryClient.invalidateQueries({
      predicate: (query) => query.queryKey[0] === "items" && (query.queryKey[1] === "starred" || query.queryKey[1] === "shared"),
    });
  }

  const markRead = useMutation({
    mutationFn: (id: string) => api.markRead(id),
    onMutate: (id) => patchItemInCache(id, { isRead: true, readAt: new Date().toISOString() }),
    onSettled: invalidateCounts,
  });
  const markUnread = useMutation({
    mutationFn: (id: string) => api.markUnread(id),
    onMutate: (id) => patchItemInCache(id, { isRead: false, readAt: null }),
    onSettled: invalidateCounts,
  });
  const star = useMutation({
    mutationFn: (id: string) => api.star(id),
    onMutate: (id) => patchItemInCache(id, { isStarred: true }),
    onSettled: invalidateSmartViews,
  });
  const unstar = useMutation({
    mutationFn: (id: string) => api.unstar(id),
    onMutate: (id) => patchItemInCache(id, { isStarred: false }),
    onSettled: invalidateSmartViews,
  });
  const share = useMutation({
    mutationFn: (id: string) => api.share(id),
    onMutate: (id) => patchItemInCache(id, { isShared: true }),
    onSettled: invalidateSmartViews,
  });
  const unshare = useMutation({
    mutationFn: (id: string) => api.unshare(id),
    onMutate: (id) => patchItemInCache(id, { isShared: false }),
    onSettled: invalidateSmartViews,
  });
  const like = useMutation({
    mutationFn: (id: string) => api.like(id),
    onMutate: (id) => patchItemInCache(id, { isLiked: true }),
  });
  const unlike = useMutation({
    mutationFn: (id: string) => api.unlike(id),
    onMutate: (id) => patchItemInCache(id, { isLiked: false }),
  });

  return {
    toggleRead: (item: Item) => (item.state?.isRead ? markUnread.mutate(item.id) : markRead.mutate(item.id)),
    markRead: (id: string) => markRead.mutate(id),
    toggleStar: (item: Item) => (item.state?.isStarred ? unstar.mutate(item.id) : star.mutate(item.id)),
    toggleShare: (item: Item) => (item.state?.isShared ? unshare.mutate(item.id) : share.mutate(item.id)),
    toggleLike: (item: Item) => (item.state?.isLiked ? unlike.mutate(item.id) : like.mutate(item.id)),
  };
}
