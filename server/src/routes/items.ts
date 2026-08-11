import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";

export const itemsRouter = Router();

async function scopeToWhere(scope: string): Promise<Prisma.ItemWhereInput> {
  if (scope === "all") return {};
  if (scope === "starred") return { state: { isStarred: true } };
  if (scope === "shared") return { state: { isShared: true } };
  if (scope.startsWith("feed:")) return { feedId: scope.slice(5) };
  if (scope.startsWith("folder:")) {
    const folderId = scope.slice(7);
    const feedFolders = await prisma.feedFolder.findMany({ where: { folderId }, select: { feedId: true } });
    return { feedId: { in: feedFolders.map((f) => f.feedId) } };
  }
  return {};
}

itemsRouter.get("/", async (req, res) => {
  const scope = String(req.query.scope || "all");
  const sort = req.query.sort === "oldest" ? "asc" : "desc";
  const unreadOnly = req.query.unreadOnly === "true";
  const limit = Math.min(Number(req.query.limit) || 40, 200);
  const offset = Number(req.query.offset) || 0;

  const scopeWhere = await scopeToWhere(scope);
  const where: Prisma.ItemWhereInput = unreadOnly
    ? { ...scopeWhere, state: { ...(scopeWhere.state as object | undefined), isRead: false } }
    : scopeWhere;

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: { feed: true, state: true },
      orderBy: { publishedAt: sort },
      take: limit,
      skip: offset,
    }),
    prisma.item.count({ where }),
  ]);

  res.json({ items, total, offset, limit });
});

itemsRouter.get("/:id", async (req, res) => {
  const item = await prisma.item.findUnique({
    where: { id: req.params.id },
    include: { feed: true, state: true },
  });
  if (!item) return res.status(404).json({ error: "not found" });
  res.json(item);
});

async function setState(id: string, data: Partial<{ isRead: boolean; isStarred: boolean; isShared: boolean; isLiked: boolean; readAt: Date | null }>) {
  return prisma.itemState.upsert({
    where: { itemId: id },
    update: data,
    create: { itemId: id, ...data },
  });
}

itemsRouter.post("/:id/read", async (req, res) => {
  res.json(await setState(req.params.id, { isRead: true, readAt: new Date() }));
});
itemsRouter.post("/:id/unread", async (req, res) => {
  res.json(await setState(req.params.id, { isRead: false, readAt: null }));
});
itemsRouter.post("/:id/star", async (req, res) => {
  res.json(await setState(req.params.id, { isStarred: true }));
});
itemsRouter.post("/:id/unstar", async (req, res) => {
  res.json(await setState(req.params.id, { isStarred: false }));
});
itemsRouter.post("/:id/share", async (req, res) => {
  res.json(await setState(req.params.id, { isShared: true }));
});
itemsRouter.post("/:id/unshare", async (req, res) => {
  res.json(await setState(req.params.id, { isShared: false }));
});
itemsRouter.post("/:id/like", async (req, res) => {
  res.json(await setState(req.params.id, { isLiked: true }));
});
itemsRouter.post("/:id/unlike", async (req, res) => {
  res.json(await setState(req.params.id, { isLiked: false }));
});

itemsRouter.post("/mark-all-read", async (req, res) => {
  const scope = String(req.query.scope || req.body?.scope || "all");
  const where = await scopeToWhere(scope);
  const items = await prisma.item.findMany({ where, select: { id: true } });
  const now = new Date();
  await prisma.$transaction(
    items.map((it) =>
      prisma.itemState.upsert({
        where: { itemId: it.id },
        update: { isRead: true, readAt: now },
        create: { itemId: it.id, isRead: true, readAt: now },
      })
    )
  );
  res.json({ marked: items.length });
});
