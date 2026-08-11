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

  const groupedActivity = await prisma.item.groupBy({
    by: ["feedId"],
    where: { state: { isRead: true } },
    _count: true,
    orderBy: { _count: { feedId: "desc" } },
    take: 10,
  });
  const activeFeeds = await prisma.feed.findMany({
    where: { id: { in: groupedActivity.map((g) => g.feedId) } },
    select: { id: true, title: true, customTitle: true },
  });
  const titleById = new Map(activeFeeds.map((f) => [f.id, f.customTitle || f.title]));
  const feedActivity = groupedActivity.map((g) => ({
    feedId: g.feedId,
    title: titleById.get(g.feedId) || "Unknown feed",
    readCount: g._count,
  }));

  const dailyRows = await prisma.$queryRaw<{ day: string; count: bigint }[]>`
    SELECT to_char(date_trunc('day', "readAt"), 'YYYY-MM-DD') as day, COUNT(*) as count
    FROM "ItemState"
    WHERE "isRead" = true AND "readAt" IS NOT NULL AND "readAt" >= ${thirtyDaysAgo}
    GROUP BY day
    ORDER BY day ASC
  `;

  res.json({
    subscriptionCount,
    totalItems,
    totalRead,
    totalStarred,
    totalShared,
    readLast30,
    unreadNow: totalItems - totalRead,
    mostActiveFeeds: feedActivity,
    dailyReadCounts: dailyRows.map((r) => ({ day: r.day, count: Number(r.count) })),
  });
});
