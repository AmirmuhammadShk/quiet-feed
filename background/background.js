/* global QuietFeed, browser */
(function () {
  "use strict";

  async function ensureSettings() {
    const stored = await browser.storage.local.get("settings");
    if (!stored.settings) {
      await browser.storage.local.set({ settings: QuietFeed.clone(QuietFeed.DEFAULT_SETTINGS) });
    } else {
      await browser.storage.local.set({ settings: QuietFeed.normalizeSettings(stored.settings) });
    }
  }

  browser.runtime.onInstalled.addListener(ensureSettings);
  browser.runtime.onStartup.addListener(ensureSettings);

  browser.runtime.onMessage.addListener((message) => {
    if (message && message.type === "log-blocked") return recordBlocked(message.entry);
  });

  let writeQueue = Promise.resolve();

  function recordBlocked(entry) {
    writeQueue = writeQueue.then(async () => {
      const stored = await browser.storage.local.get(["settings", "blockedLog", "blockedCount"]);
      const settings = QuietFeed.normalizeSettings(stored.settings);
      const nextCount = (Number(stored.blockedCount) || 0) + 1;
      if (!settings.loggingEnabled) {
        await browser.storage.local.set({ blockedCount: nextCount });
        return;
      }
      const safeEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        timestamp: new Date().toISOString(),
        site: String(entry?.site || "Unknown").slice(0, 100),
        hostname: String(entry?.hostname || "").slice(0, 255),
        policy: String(entry?.policy || "Unknown policy").slice(0, 100),
        text: String(entry?.text || "").replace(/\s+/g, " ").trim().slice(0, 3000),
        url: String(entry?.url || "").slice(0, 2000)
      };
      const log = Array.isArray(stored.blockedLog) ? stored.blockedLog : [];
      log.unshift(safeEntry);
      if (log.length > settings.maxLogEntries) log.length = settings.maxLogEntries;
      await browser.storage.local.set({ blockedLog: log, blockedCount: nextCount });
    }).catch((error) => console.error("Quiet Feed could not record a blocked post", error));
    return writeQueue;
  }

  ensureSettings().catch((error) => console.error("Quiet Feed setup failed", error));
})();
