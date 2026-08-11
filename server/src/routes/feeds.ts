import { Router } from "express";
import { prisma } from "../db.js";
import { createSubscription, fetchAndUpsertFeed } from "../services/feedFetcher.js";

export const feedsRouter = Router();

feedsRouter.get("/", async (_req, res) => {
  const feeds = await prisma.feed.findMany({
    include: { folders: { include: { folder: true } } },
    orderBy: { title: "asc" },
  });

  const rows = await prisma.$queryRawUnsafe<{ feedId: string; count: number }[]>(
    `SELECT i.feedId as feedId, COUNT(*) as count
     FROM Item i JOIN ItemState s ON s.itemId = i.id
     WHERE s.isRead = 0
     GROUP BY i.feedId`
  );
  const countMap = new Map(rows.map((r) => [r.feedId, Number(r.count)]));

  res.json(
    feeds.map((f) => ({
      ...f,
      unreadCount: countMap.get(f.id) || 0,
    }))
  );
});

feedsRouter.post("/", async (req, res) => {
  const { url, folderIds } = req.body as { url: string; folderIds?: string[] };
  if (!url?.trim()) return res.status(400).json({ error: "url is required" });
  try {
    const feed = await createSubscription(url.trim(), folderIds || []);
    res.status(201).json(feed);
  } catch (err: any) {
    res.status(422).json({ error: err.message || "Failed to subscribe" });
  }
});

feedsRouter.patch("/:id", async (req, res) => {
  const { customTitle, folderIds } = req.body as { customTitle?: string; folderIds?: string[] };
  const feed = await prisma.feed.update({
    where: { id: req.params.id },
    data: customTitle !== undefined ? { customTitle } : {},
  });

  if (folderIds) {
    await prisma.feedFolder.deleteMany({ where: { feedId: feed.id } });
    for (const folderId of folderIds) {
      await prisma.feedFolder.create({ data: { feedId: feed.id, folderId } });
    }
  }

  res.json(feed);
});

feedsRouter.delete("/:id", async (req, res) => {
  await prisma.feed.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

feedsRouter.post("/:id/refresh", async (req, res) => {
  const feed = await prisma.feed.findUnique({ where: { id: req.params.id } });
  if (!feed) return res.status(404).json({ error: "not found" });
  try {
    const result = await fetchAndUpsertFeed(feed.id, feed.url);
    res.json(result);
  } catch (err: any) {
    res.status(502).json({ error: err.message || "Failed to refresh feed" });
  }
});
