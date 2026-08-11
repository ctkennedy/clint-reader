import { Router } from "express";
import { prisma } from "../db.js";

export const settingsRouter = Router();

const DEFAULTS: Record<string, string> = {
  viewMode: "list", // "list" | "expanded"
  markReadBehavior: "scroll", // "scroll" | "open"
  sortOrder: "newest", // "newest" | "oldest"
  itemsPerPage: "40",
  theme: "light",
};

settingsRouter.get("/", async (_req, res) => {
  const rows = await prisma.setting.findMany();
  const settings: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) settings[row.key] = row.value;
  res.json(settings);
});

settingsRouter.put("/", async (req, res) => {
  const updates = req.body as Record<string, string>;
  for (const [key, value] of Object.entries(updates)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }
  const rows = await prisma.setting.findMany();
  const settings: Record<string, string> = { ...DEFAULTS };
  for (const row of rows) settings[row.key] = row.value;
  res.json(settings);
});
