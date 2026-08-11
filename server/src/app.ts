import express from "express";
import cors from "cors";
import { feedsRouter } from "./routes/feeds.js";
import { foldersRouter } from "./routes/folders.js";
import { itemsRouter } from "./routes/items.js";
import { opmlRouter } from "./routes/opml.js";
import { searchRouter } from "./routes/search.js";
import { statsRouter } from "./routes/stats.js";
import { settingsRouter } from "./routes/settings.js";
import { embedRouter } from "./routes/embed.js";

export const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.use("/api/feeds", feedsRouter);
app.use("/api/folders", foldersRouter);
app.use("/api/items", itemsRouter);
app.use("/api/opml", opmlRouter);
app.use("/api/search", searchRouter);
app.use("/api/stats", statsRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/embed", embedRouter);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: err.message || "Internal server error" });
});
