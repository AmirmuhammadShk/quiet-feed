(function (root) {
  "use strict";

  const DEFAULT_SETTINGS = {
    version: 3,
    masterEnabled: true,
    showPlaceholder: false,
    loggingEnabled: true,
    maxLogEntries: 2000,
    policies: [
      {
        id: "default-ai-policy",
        name: "AI & LLM (English + Persian)",
        enabled: true,
        match: "any",
        keywords: [
          "ai", 
          "large language model", "language model", "llm", "llms", "chatgpt", "openai",
          "claude", "gemini", "copilot", "gpt-3", "gpt-4", "gpt-5", "gpt4", "gpt5",
          "prompt engineering","agent",
          "هوش مصنوعی", "هوش‌مصنوعی",
          "مدل زبانی", "مدل زبان بزرگ", "مدل‌های زبانی", "مدل های زبانی", "چت جی پی تی",
          "چت‌جی‌پی‌تی", "اوپن ای آی", "هوش مولد", "پرامپت نویسی","ایجنت", "کلاد"
        ]
      }
    ],
    sites: [
      {
        id: "twitter",
        name: "X / Twitter",
        enabled: true,
        hosts: ["twitter.com", "x.com"],
        postSelectors: ["article[data-testid='tweet']"]
      },
      {
        id: "linkedin",
        name: "LinkedIn",
        enabled: true,
        hosts: ["linkedin.com"],
        postSelectors: [
          "[data-view-name='feed-full-update']",
          "[data-testid='main-feed-activity-card']",
          "[data-id^='urn:li:activity:']",
          ".feed-shared-update-v2",
          "div[data-urn^='urn:li:activity']",
          ".fie-impression-container",
          ".occludable-update"
        ]
      }
    ]
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeSettings(value) {
    const source = value && typeof value === "object" ? value : {};
    const sites = Array.isArray(source.sites) ? clone(source.sites) : clone(DEFAULT_SETTINGS.sites);
    const linkedInDefaults = DEFAULT_SETTINGS.sites.find((site) => site.id === "linkedin");
    const linkedIn = sites.find((site) => site.id === "linkedin");
    if (linkedIn && linkedInDefaults) {
      const existing = Array.isArray(linkedIn.postSelectors) ? linkedIn.postSelectors : [];
      linkedIn.postSelectors = [...new Set([...existing, ...linkedInDefaults.postSelectors])];
    }
    return {
      version: 3,
      masterEnabled: source.masterEnabled !== false,
      showPlaceholder: source.showPlaceholder === true,
      loggingEnabled: source.loggingEnabled !== false,
      maxLogEntries: Number.isInteger(source.maxLogEntries) ? Math.min(5000, Math.max(100, source.maxLogEntries)) : DEFAULT_SETTINGS.maxLogEntries,
      policies: Array.isArray(source.policies) ? source.policies : clone(DEFAULT_SETTINGS.policies),
      sites
    };
  }

  root.QuietFeed = { DEFAULT_SETTINGS, clone, normalizeSettings };
})(typeof globalThis !== "undefined" ? globalThis : this);
