import { app } from "./app.js";
import { startPoller } from "./services/poller.js";

const PORT = Number(process.env.PORT) || 3001;

app.listen(PORT, () => {
  console.log(`Clint Reader server listening on http://localhost:${PORT}`);
  startPoller();
});
