import { Router } from "express";
import { prisma } from "../db.js";

export const statsRouter = Router();

statsRouter.get("/trends", async (_req, res) => {
  const [subscriptionCount, totalItems, totalRead, totalStarred, totalShared] = await Promise.all([
    prisma.feed.count(),
    prisma.item.count(),
    prisma.itemState.count({ where: { isRead: true } }),
    prisma.itemState.count({ where: { isStarred: true } }),
    prisma.itemState.count({ where: { isShared: true } }),
  ]);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const readLast30 = await prisma.itemState.count({
    where: { isRead: true, readAt: { gte: thirtyDaysAgo } },
  });

  const feedActivity = await prisma.$queryRawUnsafe<{ feedId: string; title: string; readCount: number }[]>(
    `SELECT f.id as feedId, COALESCE(f.customTitle, f.title) as title, COUNT(*) as readCount
     FROM ItemState s
     JOIN Item i ON i.id = s.itemId
     JOIN Feed f ON f.id = i.feedId
     WHERE s.isRead = 1
     GROUP BY f.id
     ORDER BY readCount DESC
     LIMIT 10`
  );

  // Prisma stores SQLite DateTime columns as integer Unix-ms, not ISO text,
  // so raw SQL needs date(readAt / 1000, 'unixepoch') and an integer bound.
  const dailyRows = await prisma.$queryRawUnsafe<{ day: string; count: number }[]>(
    `SELECT date(readAt / 1000, 'unixepoch') as day, COUNT(*) as count
     FROM ItemState
     WHERE isRead = 1 AND readAt IS NOT NULL AND readAt >= ?
     GROUP BY day
     ORDER BY day ASC`,
    thirtyDaysAgo.getTime()
  );

  res.json({
    subscriptionCount,
    totalItems,
    totalRead,
    totalStarred,
    totalShared,
    readLast30,
    unreadNow: totalItems - totalRead,
    mostActiveFeeds: feedActivity.map((r) => ({ ...r, readCount: Number(r.readCount) })),
    dailyReadCounts: dailyRows.map((r) => ({ day: r.day, count: Number(r.count) })),
  });
});
