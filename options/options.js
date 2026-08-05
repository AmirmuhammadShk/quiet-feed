/* global QuietFeed, browser */
(function () {
  "use strict";
  let settings;
  let blockedLog = [];
  let blockedCount = 0;
  const $ = (selector) => document.querySelector(selector);
  const lines = (value) => value.split(/\r?\n/).map((part) => part.trim()).filter(Boolean);
  const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  async function save(message = "Settings saved") {
    await browser.storage.local.set({ settings });
    const toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 1600);
  }

  function itemTemplate(item, meta, kind) {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `<div class="item-main"><div class="item-title"></div><div class="item-meta"></div></div><div class="item-actions"><label class="switch" title="Enable"><input class="enabled" type="checkbox"><span></span></label><button class="secondary edit">Edit</button><button class="icon-button delete" aria-label="Delete">Delete</button></div>`;
    row.querySelector(".item-title").textContent = item.name;
    row.querySelector(".item-meta").textContent = meta;
    row.querySelector(".enabled").checked = item.enabled;
    row.querySelector(".enabled").addEventListener("change", async (event) => { item.enabled = event.target.checked; await save(); });
    row.querySelector(".edit").addEventListener("click", () => kind === "policy" ? openPolicy(item) : openSite(item));
    row.querySelector(".delete").addEventListener("click", async () => {
      if (!confirm(`Delete “${item.name}”?`)) return;
      const collection = kind === "policy" ? settings.policies : settings.sites;
      collection.splice(collection.indexOf(item), 1);
      await save(); render();
    });
    return row;
  }

  function render() {
    $("#master-enabled").checked = settings.masterEnabled;
    $("#show-placeholder").checked = settings.showPlaceholder;
    $("#logging-enabled").checked = settings.loggingEnabled;
    const policies = $("#policy-list"); policies.replaceChildren();
    settings.policies.forEach((policy) => policies.append(itemTemplate(policy, `${policy.keywords.length} keywords · match ${policy.match || "any"}`, "policy")));
    if (!settings.policies.length) policies.innerHTML = '<div class="empty">No policies yet.</div>';
    const sites = $("#site-list"); sites.replaceChildren();
    settings.sites.forEach((site) => sites.append(itemTemplate(site, site.hosts.join(", "), "site")));
    if (!settings.sites.length) sites.innerHTML = '<div class="empty">No sites yet.</div>';
    renderLog();
  }

  function filteredLog() {
    const query = normalizeSearch($("#log-search")?.value || "");
    const selectedSite = $("#log-site-filter")?.value || "";
    return blockedLog.filter((entry) => {
      if (selectedSite && entry.site !== selectedSite) return false;
      if (!query) return true;
      return normalizeSearch(`${entry.text} ${entry.site} ${entry.hostname} ${entry.policy} ${entry.url}`).includes(query);
    });
  }

  function normalizeSearch(value) {
    return String(value).toLocaleLowerCase().normalize("NFKC").replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/[\u200c\u200d]/g, " ");
  }

  function renderLog() {
    if (!$("#log-list")) return;
    $("#blocked-total").textContent = blockedCount.toLocaleString();
    $("#nav-count").textContent = blockedCount.toLocaleString();
    const siteFilter = $("#log-site-filter");
    const previous = siteFilter.value;
    const sites = [...new Set(blockedLog.map((entry) => entry.site).filter(Boolean))].sort();
    siteFilter.replaceChildren(new Option("All sites", ""), ...sites.map((name) => new Option(name, name)));
    if (sites.includes(previous)) siteFilter.value = previous;
    const entries = filteredLog();
    $("#log-summary").textContent = `${entries.length.toLocaleString()} of ${blockedLog.length.toLocaleString()} stored entries`;
    const list = $("#log-list"); list.replaceChildren();
    if (!entries.length) {
      list.innerHTML = '<div class="empty">No blocked content matches this search.</div>';
      return;
    }
    entries.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "card log-entry";
      const head = document.createElement("div"); head.className = "log-entry-head";
      const meta = document.createElement("div"); meta.className = "log-entry-meta";
      const siteName = document.createElement("strong"); siteName.textContent = entry.site || entry.hostname || "Unknown site";
      const policy = document.createElement("span"); policy.className = "log-entry-policy"; policy.textContent = entry.policy || "Unknown policy";
      meta.append(siteName, policy);
      const time = document.createElement("time"); time.className = "log-entry-meta"; time.dateTime = entry.timestamp; time.textContent = new Date(entry.timestamp).toLocaleString();
      head.append(meta, time);
      const content = document.createElement("div"); content.className = "log-entry-text"; content.textContent = entry.text || "(No text captured)";
      card.append(head, content);
      if (/^https?:\/\//i.test(entry.url || "")) {
        const link = document.createElement("a"); link.className = "log-entry-link"; link.href = entry.url; link.target = "_blank"; link.rel = "noopener noreferrer"; link.textContent = "Open original post ↗"; card.append(link);
      }
      list.append(card);
    });
  }

  function downloadLog(format) {
    const entries = filteredLog();
    let content;
    let type;
    if (format === "json") {
      content = JSON.stringify(entries, null, 2); type = "application/json";
    } else {
      const quote = (value) => {
        let safe = String(value ?? "");
        if (/^[=+\-@]/.test(safe)) safe = `'${safe}`;
        return `"${safe.replace(/"/g, '""')}"`;
      };
      content = ["timestamp,site,hostname,policy,text,url", ...entries.map((entry) => [entry.timestamp, entry.site, entry.hostname, entry.policy, entry.text, entry.url].map(quote).join(","))].join("\r\n");
      type = "text/csv";
    }
    const url = URL.createObjectURL(new Blob([content], { type }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `quiet-feed-blocked-${new Date().toISOString().slice(0, 10)}.${format}`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function openPolicy(policy) {
    $("#policy-title").textContent = policy ? "Edit policy" : "Add policy";
    $("#policy-id").value = policy?.id || "";
    $("#policy-name").value = policy?.name || "";
    $("#policy-match").value = policy?.match || "any";
    $("#policy-keywords").value = policy?.keywords.join("\n") || "";
    $("#policy-dialog").showModal();
  }

  function openSite(site) {
    $("#site-title").textContent = site ? "Edit site" : "Add site";
    $("#site-id").value = site?.id || "";
    $("#site-name").value = site?.name || "";
    $("#site-hosts").value = site?.hosts.join("\n") || "";
    $("#site-selectors").value = site?.postSelectors.join("\n") || "";
    $("#site-dialog").showModal();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const stored = await browser.storage.local.get(["settings", "blockedLog", "blockedCount", "openOptionsTab"]);
    settings = QuietFeed.normalizeSettings(stored.settings || QuietFeed.clone(QuietFeed.DEFAULT_SETTINGS));
    blockedLog = Array.isArray(stored.blockedLog) ? stored.blockedLog : [];
    blockedCount = Number(stored.blockedCount) || 0;
    render();

    if (stored.openOptionsTab === "activity") {
      document.querySelectorAll(".tab,.panel").forEach((element) => element.classList.remove("active"));
      document.querySelector('[data-tab="activity"]').classList.add("active");
      $("#activity").classList.add("active");
      await browser.storage.local.remove("openOptionsTab");
    }

    document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => {
      document.querySelectorAll(".tab,.panel").forEach((element) => element.classList.remove("active"));
      tab.classList.add("active"); $(`#${tab.dataset.tab}`).classList.add("active");
    }));
    $("#master-enabled").addEventListener("change", async (e) => { settings.masterEnabled = e.target.checked; await save(); });
    $("#show-placeholder").addEventListener("change", async (e) => { settings.showPlaceholder = e.target.checked; await save(); });
    $("#logging-enabled").addEventListener("change", async (e) => { settings.loggingEnabled = e.target.checked; await save(); });
    $("#log-search").addEventListener("input", renderLog);
    $("#log-site-filter").addEventListener("change", renderLog);
    $("#export-json").addEventListener("click", () => downloadLog("json"));
    $("#export-csv").addEventListener("click", () => downloadLog("csv"));
    $("#clear-log").addEventListener("click", async () => {
      if (!confirm("Clear all blocked-content history and reset the counter?")) return;
      blockedLog = []; blockedCount = 0;
      await browser.storage.local.set({ blockedLog, blockedCount });
      renderLog(); await save("Blocked history cleared");
    });
    $("#add-policy").addEventListener("click", () => openPolicy());
    $("#add-site").addEventListener("click", () => openSite());
    document.querySelectorAll("dialog .close").forEach((button) => button.addEventListener("click", () => button.closest("dialog").close()));

    $("#policy-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = $("#policy-id").value;
      const existing = settings.policies.find((item) => item.id === id);
      const value = { id: id || uid("policy"), name: $("#policy-name").value.trim(), enabled: existing?.enabled ?? true, match: $("#policy-match").value, keywords: lines($("#policy-keywords").value) };
      if (existing) Object.assign(existing, value); else settings.policies.push(value);
      await save(); $("#policy-dialog").close(); render();
    });
    $("#site-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const id = $("#site-id").value;
      const existing = settings.sites.find((item) => item.id === id);
      const hosts = lines($("#site-hosts").value).map((host) => host.replace(/^https?:\/\//, "").split("/")[0].toLowerCase());
      const value = { id: id || uid("site"), name: $("#site-name").value.trim(), enabled: existing?.enabled ?? true, hosts, postSelectors: lines($("#site-selectors").value) };
      if (existing) Object.assign(existing, value); else settings.sites.push(value);
      await save(); $("#site-dialog").close(); render();
    });
    $("#reset-settings").addEventListener("click", async () => {
      if (!confirm("Reset all Quiet Feed settings?")) return;
      settings = QuietFeed.clone(QuietFeed.DEFAULT_SETTINGS); await save("Defaults restored"); render();
    });
    browser.storage.onChanged.addListener((changes, area) => {
      if (area !== "local") return;
      if (changes.blockedLog) blockedLog = Array.isArray(changes.blockedLog.newValue) ? changes.blockedLog.newValue : [];
      if (changes.blockedCount) blockedCount = Number(changes.blockedCount.newValue) || 0;
      if (changes.blockedLog || changes.blockedCount) renderLog();
    });
  });
})();
