import { Router } from "express";
import { prisma } from "../db.js";

export const searchRouter = Router();

searchRouter.get("/", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json({ items: [] });

  const items = await prisma.item.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { summary: { contains: q } },
        { contentHtml: { contains: q } },
        { author: { contains: q } },
      ],
    },
    include: { feed: true, state: true },
    orderBy: { publishedAt: "desc" },
    take: 100,
  });
  res.json({ items });
});
