/* global QuietFeed, browser */
(function () {
  "use strict";

  let settings;
  let site;
  let observer;
  let queued = false;
  let linkedInTimer;
  const linkedInLastText = new WeakMap();
  const hidden = new Map();
  const loggedPosts = new WeakSet();
  const LINKEDIN_POST_SELECTOR = [
    "[data-view-name='feed-full-update']",
    "[data-testid='main-feed-activity-card']",
    "[data-id^='urn:li:activity:']",
    "[data-urn^='urn:li:activity:']",
    ".feed-shared-update-v2",
    ".fie-impression-container",
    ".occludable-update",
    "main article",
    "main [role='article']"
  ].join(",");
  const LINKEDIN_TEXT_SELECTORS = [
    "[data-view-name='feed-commentary']",
    "[data-testid='main-feed-activity-card__commentary']",
    "[data-testid='expandable-text-box']",
    ".update-components-update-v2__commentary",
    ".update-components-text",
    ".feed-shared-update-v2__description-wrapper",
    ".feed-shared-update-v2__description",
    ".feed-shared-inline-show-more-text",
    ".feed-shared-text"
  ];

  const normalize = (text) => text
    .toLocaleLowerCase()
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[\u200c\u200d]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  function hostMatches(host, configuredHost) {
    const target = configuredHost.trim().toLowerCase().replace(/^\*\./, "");
    return target && (host === target || host.endsWith(`.${target}`));
  }

  function getSite(currentSettings) {
    const host = location.hostname.toLowerCase();
    return currentSettings.sites.find((candidate) =>
      candidate.enabled && Array.isArray(candidate.hosts) &&
      candidate.hosts.some((entry) => hostMatches(host, entry))
    );
  }

  function activePolicies() {
    return settings.policies.filter((policy) =>
      policy.enabled && Array.isArray(policy.keywords) && policy.keywords.length
    );
  }

  function matchedPolicy(text) {
    const haystack = normalize(text);
    const hasKeyword = (keyword) => {
      if (!/^[a-z0-9-]+$/.test(keyword)) return haystack.includes(keyword);
      const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(haystack);
    };
    return activePolicies().find((policy) => {
      const results = policy.keywords.map(normalize).filter(Boolean).map(hasKeyword);
      return policy.match === "all" ? results.length > 0 && results.every(Boolean) : results.some(Boolean);
    });
  }

  function hidePost(post, policy, matchedText) {
    if (post.dataset.quietFeedChecked === "hidden") return;
    const capturedText = matchedText ?? post.innerText ?? post.textContent ?? "";
    post.dataset.quietFeedChecked = "hidden";
    post.classList.add("quiet-feed-hidden");
    let placeholder = null;
    if (settings.showPlaceholder) {
      placeholder = document.createElement("div");
      placeholder.className = "quiet-feed-placeholder";
      placeholder.textContent = `Quiet Feed hid a post matching “${policy.name}”.`;
      post.before(placeholder);
    }
    hidden.set(post, placeholder);
    if (!loggedPosts.has(post)) {
      loggedPosts.add(post);
      const postLink = Array.from(post.querySelectorAll("a[href]"))
        .map((link) => link.href)
        .find((href) => /\/(status|posts|feed\/update)\//i.test(href));
      browser.runtime.sendMessage({
        type: "log-blocked",
        entry: { site: site.name, hostname: location.hostname, policy: policy.name, text: capturedText, url: postLink || location.href }
      }).catch(() => {});
    }
  }

  function restoreAll() {
    hidden.forEach((placeholder, post) => {
      post.classList.remove("quiet-feed-hidden");
      delete post.dataset.quietFeedChecked;
      if (placeholder) placeholder.remove();
    });
    hidden.clear();
  }

  function scanConfiguredSite() {
    const selector = site.postSelectors.filter(Boolean).join(",");
    if (!selector) return;
    let posts;
    try {
      posts = document.querySelectorAll(selector);
    } catch (error) {
      console.warn("Quiet Feed ignored an invalid post selector", error);
      return;
    }
    posts.forEach((post) => {
      if (post.parentElement?.closest(selector)) return;
      if (post.dataset.quietFeedChecked === "hidden") return;
      const policy = matchedPolicy(post.innerText || post.textContent || "");
      if (policy) hidePost(post, policy);
    });
  }

  function linkedInPostText(post) {
    for (const selector of LINKEDIN_TEXT_SELECTORS) {
      const body = post.querySelector(selector);
      if (!body || body.closest("[data-view-name*='comment-thread'],.comments-comments-list")) continue;
      const text = (body.innerText || body.textContent || "").trim();
      if (text) return text;
    }
    const fallback = Array.from(post.querySelectorAll("[dir='auto'],[dir='ltr'],[dir='rtl']"))
      .filter((element) => !element.closest("header,nav,[data-view-name*='comment-thread'],.comments-comments-list") && !element.querySelector("button,[role='button']"))
      .map((element) => (element.innerText || element.textContent || "").trim())
      .filter((text) => text.length >= 2 && text.length <= 10000)
      .sort((a, b) => b.length - a.length);
    return fallback[0] || "";
  }

  function checkVisibleLinkedInPost(post) {
    if (!post.isConnected || post.dataset.quietFeedChecked === "hidden" || post.parentElement?.closest(".quiet-feed-hidden")) return;
    const text = linkedInPostText(post);
    if (!text || linkedInLastText.get(post) === text) return;
    linkedInLastText.set(post, text);
    const policy = matchedPolicy(text);
    if (policy) hidePost(post, policy, text);
  }

  function linkedInRootFor(element) {
    const known = element.closest(LINKEDIN_POST_SELECTOR);
    if (known) return known;
    const main = element.closest("main") || document.querySelector("main");
    let current = element;
    while (current && current !== main && current !== document.body) {
      const hasPostLink = current.querySelector("a[href*='/feed/update/'],a[href*='/posts/']");
      const actionCount = current.querySelectorAll("button[aria-pressed],[data-view-name*='reaction'],[data-view-name*='comment'],[data-view-name*='repost']").length;
      if (hasPostLink || actionCount >= 2) return current;
      current = current.parentElement;
    }
    return null;
  }

  function scanLinkedInViewport() {
    if (!settings?.masterEnabled || site?.id !== "linkedin") return;
    const posts = new Set();
    document.querySelectorAll(LINKEDIN_POST_SELECTOR).forEach((post) => {
      const rect = post.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth) posts.add(post);
    });
    const xPoints = [innerWidth * 0.4, innerWidth * 0.5, innerWidth * 0.6];
    for (let y = 80; y < innerHeight; y += 120) {
      xPoints.forEach((x) => document.elementsFromPoint(x, y).forEach((element) => {
        const root = linkedInRootFor(element);
        if (root) posts.add(root);
      }));
    }
    posts.forEach(checkVisibleLinkedInPost);
  }

  function scan() {
    queued = false;
    if (!settings || !settings.masterEnabled || !site) return;
    if (site.id !== "linkedin") scanConfiguredSite();
  }

  function scheduleScan() {
    if (site?.id === "linkedin") {
      clearTimeout(linkedInTimer);
      linkedInTimer = setTimeout(scanLinkedInViewport, 120);
      return;
    }
    if (queued) return;
    queued = true;
    requestAnimationFrame(scan);
  }

  function start(nextSettings) {
    restoreAll();
    settings = QuietFeed.normalizeSettings(nextSettings);
    site = getSite(settings);
    if (observer) observer.disconnect();
    window.removeEventListener("scroll", scheduleScan);
    window.removeEventListener("resize", scheduleScan);
    clearTimeout(linkedInTimer);
    if (!settings.masterEnabled || !site) return;
    observer = new MutationObserver(scheduleScan);
    observer.observe(document.documentElement, { childList: true, subtree: true });
    if (site.id === "linkedin") {
      window.addEventListener("scroll", scheduleScan, { passive: true });
      window.addEventListener("resize", scheduleScan, { passive: true });
      scheduleScan();
    } else scheduleScan();
  }

  browser.storage.local.get("settings").then(({ settings: stored }) => start(stored || QuietFeed.DEFAULT_SETTINGS));
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.settings) start(changes.settings.newValue);
  });
})();
