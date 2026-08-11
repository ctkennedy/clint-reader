// Netlify Functions get real env vars injected directly into process.env, but a
// plain local `tsx` run has nothing loading .env — Prisma's own auto-loading only
// covers the `prisma` CLI, not arbitrary app code that instantiates PrismaClient.
process.loadEnvFile();

import { app } from "./app.js";
import { startPoller } from "./services/poller.js";

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Clint Reader server listening on http://localhost:${PORT}`);
  startPoller();
});
