import { Router } from "express";
import { generateOpml, importOpml } from "../services/opml.js";

export const opmlRouter = Router();

opmlRouter.get("/export", async (_req, res) => {
  const xml = await generateOpml();
  res.setHeader("Content-Type", "text/x-opml");
  res.setHeader("Content-Disposition", 'attachment; filename="clint-reader-subscriptions.opml"');
  res.send(xml);
});

opmlRouter.post("/import", async (req, res) => {
  const { xml } = req.body as { xml: string };
  if (!xml) return res.status(400).json({ error: "xml is required" });
  try {
    const result = await importOpml(xml);
    res.json(result);
  } catch (err: any) {
    res.status(422).json({ error: err.message || "Failed to import OPML" });
  }
});
