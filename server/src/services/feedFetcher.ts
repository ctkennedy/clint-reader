import Parser from "rss-parser";
import { prisma } from "../db.js";

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "ClintReader/1.0 (+https://github.com/clintreader)" },
});

function guidFor(item: Parser.Item): string {
  const raw = item as unknown as { guid?: string; id?: string };
  return raw.guid || raw.id || item.link || `${item.title}-${item.pubDate ?? ""}`;
}

function faviconFor(siteUrl: string | undefined): string | undefined {
  if (!siteUrl) return undefined;
  try {
    const u = new URL(siteUrl);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return undefined;
  }
}

export async function discoverFeedUrl(inputUrl: string): Promise<string> {
  // If it already looks like a feed, try it directly first.
  try {
    await parser.parseURL(inputUrl);
    return inputUrl;
  } catch {
    // fall through to HTML discovery
  }

  const res = await fetch(inputUrl, {
    headers: { "User-Agent": "ClintReader/1.0" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Could not fetch ${inputUrl} (${res.status})`);
  const html = await res.text();

  const linkRegex = /<link\s+[^>]*rel=["']alternate["'][^>]*>/gi;
  const matches = html.match(linkRegex) || [];
  for (const tag of matches) {
    const typeMatch = tag.match(/type=["'](application\/(rss|atom)\+xml)["']/i);
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (typeMatch && hrefMatch) {
      return new URL(hrefMatch[1], inputUrl).toString();
    }
  }

  throw new Error(`No RSS/Atom feed found at ${inputUrl}`);
}

export async function fetchAndUpsertFeed(feedId: string, feedUrl: string) {
  const parsed = await parser.parseURL(feedUrl);

  const feed = await prisma.feed.update({
    where: { id: feedId },
    data: {
      title: (await prisma.feed.findUnique({ where: { id: feedId } }))?.customTitle
        ? undefined
        : parsed.title || feedUrl,
      siteUrl: parsed.link ?? undefined,
      description: parsed.description ?? undefined,
      faviconUrl: faviconFor(parsed.link ?? undefined),
      lastFetchedAt: new Date(),
      lastError: null,
    },
  });

  let newCount = 0;
  for (const item of parsed.items) {
    const guid = guidFor(item);
    const publishedAt = item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : new Date();

    const existing = await prisma.item.findUnique({
      where: { feedId_guid: { feedId, guid } },
    });
    if (existing) continue;

    await prisma.item.create({
      data: {
        feedId,
        guid,
        url: item.link,
        title: item.title || "(untitled)",
        author: item.creator || item.author,
        contentHtml: item.content || item["content:encoded"] || item.contentSnippet,
        summary: item.contentSnippet || item.summary,
        publishedAt,
        state: { create: {} },
      },
    });
    newCount++;
  }

  return { feed, newCount };
}

export async function createSubscription(feedUrl: string, folderIds: string[]) {
  const resolvedUrl = await discoverFeedUrl(feedUrl);
  const parsed = await parser.parseURL(resolvedUrl);

  const feed = await prisma.feed.upsert({
    where: { url: resolvedUrl },
    update: {},
    create: {
      url: resolvedUrl,
      title: parsed.title || resolvedUrl,
      siteUrl: parsed.link,
      description: parsed.description,
      faviconUrl: faviconFor(parsed.link),
    },
  });

  for (const folderId of folderIds) {
    await prisma.feedFolder.upsert({
      where: { feedId_folderId: { feedId: feed.id, folderId } },
      update: {},
      create: { feedId: feed.id, folderId },
    });
  }

  await fetchAndUpsertFeed(feed.id, resolvedUrl);
  return feed;
}

export async function refreshAllFeeds() {
  const feeds = await prisma.feed.findMany();
  const results = await Promise.allSettled(
    feeds.map((f) => fetchAndUpsertFeed(f.id, f.url))
  );
  results.forEach(async (r, i) => {
    if (r.status === "rejected") {
      await prisma.feed.update({
        where: { id: feeds[i].id },
        data: { lastError: String(r.reason?.message || r.reason) },
      }).catch(() => {});
    }
  });
  return results;
}
