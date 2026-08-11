import type { Config } from "@netlify/functions";
import { refreshAllFeeds } from "../../server/src/services/feedFetcher.js";

export default async () => {
  const results = await refreshAllFeeds();
  const failed = results.filter((r) => r.status === "rejected").length;
  console.log(`[scheduled-poller] refreshed feeds, ${failed} failure(s), at ${new Date().toISOString()}`);
};

export const config: Config = {
  schedule: "*/15 * * * *",
};
