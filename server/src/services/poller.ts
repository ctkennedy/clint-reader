import cron from "node-cron";
import { refreshAllFeeds } from "./feedFetcher.js";

let running = false;

export function startPoller() {
  // Reader polled subscriptions in the background every ~15-30 min.
  cron.schedule("*/15 * * * *", async () => {
    if (running) return;
    running = true;
    try {
      await refreshAllFeeds();
      console.log(`[poller] refreshed feeds at ${new Date().toISOString()}`);
    } catch (err) {
      console.error("[poller] error", err);
    } finally {
      running = false;
    }
  });

  // Kick off an initial refresh shortly after boot.
  setTimeout(() => {
    refreshAllFeeds().catch((err) => console.error("[poller] initial refresh error", err));
  }, 2000);
}
