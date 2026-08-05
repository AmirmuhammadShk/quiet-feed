/* global QuietFeed, browser */
(async function () {
  "use strict";
  const stored = await browser.storage.local.get(["settings", "blockedCount"]);
  const settings = QuietFeed.normalizeSettings(stored.settings || QuietFeed.DEFAULT_SETTINGS);
  const enabled = document.querySelector("#enabled");
  enabled.checked = settings.masterEnabled;
  document.querySelector("#blocked-count").textContent = (Number(stored.blockedCount) || 0).toLocaleString();
  document.querySelector("#status").textContent = settings.masterEnabled ? "Active" : "Paused";
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  let host = "";
  try { host = new URL(tab.url).hostname; } catch (_) { /* Internal Firefox page. */ }
  const site = settings.sites.find((item) => item.hosts.some((entry) => host === entry || host.endsWith(`.${entry.replace(/^\*\./, "")}`)));
  document.querySelector("#site-state").textContent = site ? `${site.name}: ${site.enabled ? "enabled" : "disabled"}` : "This site is not configured.";
  enabled.addEventListener("change", async () => {
    settings.masterEnabled = enabled.checked;
    await browser.storage.local.set({ settings });
    document.querySelector("#status").textContent = enabled.checked ? "Active" : "Paused";
  });
  document.querySelector("#settings").addEventListener("click", () => browser.runtime.openOptionsPage());
  document.querySelector("#activity").addEventListener("click", async () => {
    await browser.storage.local.set({ openOptionsTab: "activity" });
    browser.runtime.openOptionsPage();
  });
})();
