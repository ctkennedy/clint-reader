import { parseStringPromise } from "xml2js";
import { prisma } from "../db.js";
import { createSubscription } from "./feedFetcher.js";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function generateOpml(): Promise<string> {
  const folders = await prisma.folder.findMany({
    include: { feeds: { include: { feed: true } } },
    orderBy: { order: "asc" },
  });
  const allFeeds = await prisma.feed.findMany({ include: { folders: true } });
  const unfiled = allFeeds.filter((f) => f.folders.length === 0);

  const feedOutline = (feed: { title: string; customTitle: string | null; url: string; siteUrl: string | null }) =>
    `<outline text="${xmlEscape(feed.customTitle || feed.title)}" title="${xmlEscape(
      feed.customTitle || feed.title
    )}" type="rss" xmlUrl="${xmlEscape(feed.url)}"${feed.siteUrl ? ` htmlUrl="${xmlEscape(feed.siteUrl)}"` : ""}/>`;

  const folderOutlines = folders
    .map(
      (folder) =>
        `<outline text="${xmlEscape(folder.name)}" title="${xmlEscape(folder.name)}">\n` +
        folder.feeds.map((ff) => "      " + feedOutline(ff.feed)).join("\n") +
        `\n    </outline>`
    )
    .join("\n    ");

  const unfiledOutlines = unfiled.map((f) => "    " + feedOutline(f)).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>Clint Reader Subscriptions</title>
  </head>
  <body>
    ${folderOutlines}
${unfiledOutlines}
  </body>
</opml>`;
}

interface OpmlOutline {
  $?: { text?: string; title?: string; type?: string; xmlUrl?: string; htmlUrl?: string };
  outline?: OpmlOutline[];
}

export async function importOpml(xml: string): Promise<{ imported: number; failed: number }> {
  const parsed = await parseStringPromise(xml);
  const body = parsed?.opml?.body?.[0];
  const topOutlines: OpmlOutline[] = body?.outline || [];

  let imported = 0;
  let failed = 0;

  async function walk(outline: OpmlOutline, folderId: string | null) {
    const attrs = outline.$ || {};
    if (attrs.xmlUrl) {
      try {
        await createSubscription(attrs.xmlUrl, folderId ? [folderId] : []);
        imported++;
      } catch {
        failed++;
      }
      return;
    }
    // It's a folder outline
    if (attrs.text || attrs.title) {
      const name = attrs.text || attrs.title || "Untitled";
      const folder = await prisma.folder.upsert({
        where: { name },
        update: {},
        create: { name },
      });
      for (const child of outline.outline || []) {
        await walk(child, folder.id);
      }
    }
  }

  for (const outline of topOutlines) {
    await walk(outline, null);
  }

  return { imported, failed };
}
