import { Router } from "express";

export const embedRouter = Router();

// A blocked cross-origin iframe navigation fails silently at the browser/network
// level — no JS-visible error, and Chrome still fires `load` on the frame almost
// instantly regardless. The only reliable signal is inspecting the target's own
// response headers server-side before ever attempting to embed it.
embedRouter.get("/check", async (req, res) => {
  const url = String(req.query.url || "");
  if (!url) return res.status(400).json({ error: "url is required" });

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "ClintReader/1.0 (+https://github.com/clintreader)" },
    });

    let embeddable = true;
    const xFrameOptions = response.headers.get("x-frame-options");
    if (xFrameOptions) embeddable = false;

    const csp = response.headers.get("content-security-policy");
    const frameAncestors = csp?.match(/frame-ancestors\s+([^;]+)/i)?.[1];
    if (frameAncestors) {
      // A specific host list (even with subdomain wildcards like https://*.example.com)
      // only ever whitelists the target's own properties, never our reader's origin —
      // only a standalone "*" token actually permits embedding from anywhere.
      const tokens = frameAncestors.trim().split(/\s+/);
      if (!tokens.includes("*")) embeddable = false;
    }

    res.json({ embeddable });
  } catch {
    // Can't reach it or the check itself failed — don't block the user on our
    // own uncertainty, let the iframe attempt happen and speak for itself.
    res.json({ embeddable: true, checkFailed: true });
  }
});
