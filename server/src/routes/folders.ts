import { Router } from "express";
import { prisma } from "../db.js";

export const foldersRouter = Router();

foldersRouter.get("/", async (_req, res) => {
  const folders = await prisma.folder.findMany({
    orderBy: { order: "asc" },
    include: { feeds: { include: { feed: true } } },
  });
  res.json(folders);
});

foldersRouter.post("/", async (req, res) => {
  const { name } = req.body as { name: string };
  if (!name?.trim()) return res.status(400).json({ error: "name is required" });
  const count = await prisma.folder.count();
  const folder = await prisma.folder.create({ data: { name: name.trim(), order: count } });
  res.status(201).json(folder);
});

foldersRouter.patch("/:id", async (req, res) => {
  const { name, order } = req.body as { name?: string; order?: number };
  const folder = await prisma.folder.update({
    where: { id: req.params.id },
    data: { ...(name ? { name } : {}), ...(order !== undefined ? { order } : {}) },
  });
  res.json(folder);
});

foldersRouter.delete("/:id", async (req, res) => {
  await prisma.folder.delete({ where: { id: req.params.id } });
  res.status(204).end();
});
