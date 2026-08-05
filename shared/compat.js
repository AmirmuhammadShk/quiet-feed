/* A minimal Promise-based WebExtensions compatibility bridge for Chromium. */
if (typeof globalThis.browser === "undefined" && typeof globalThis.chrome !== "undefined") {
  globalThis.browser = globalThis.chrome;
}
