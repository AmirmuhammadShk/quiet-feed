# Quiet Feed

Quiet Feed is an open-source Firefox extension that hides social-media posts matching user-defined keyword policies. It currently supports X/Twitter and LinkedIn, with an included English and Persian policy for AI and large-language-model topics.

All filtering happens locally in the browser. Quiet Feed has no server, account, telemetry, advertising, or remote analytics.

## Features

- Hide posts containing configured keywords or phrases.
- Match any keyword or require every keyword in a policy.
- Create, edit, delete, enable, and disable policies.
- Enable or disable each supported site independently.
- Add other sites with hostnames and post-container CSS selectors.
- Normalize English and Persian text for case and character variants.
- Filter dynamically loaded feeds without reloading the page.
- Scan LinkedIn posts only as they enter the viewport while scrolling.
- Compare only LinkedIn's extracted post-body text, excluding surrounding feed content.
- Display a persistent blocked-post counter in the popup.
- Keep an optional, bounded local blocked-content history.
- Search and filter blocked history by text, policy, or site.
- Export filtered history as JSON or CSV.
- Show optional placeholders where posts were hidden.
- Support light and dark browser themes.

## Included policy

The default enabled policy filters common English and Persian AI/LLM terms, including terms such as `AI`, `LLM`, `ChatGPT`, `OpenAI`, `هوش مصنوعی`, and `مدل زبانی`.

The included list is a starting point, not an exhaustive classification system. Every keyword can be edited or removed from the extension settings.

## Supported sites

### X / Twitter

Quiet Feed filters tweet article containers as they are inserted into the timeline.

### LinkedIn

Quiet Feed uses a separate viewport-based path for LinkedIn. It locates visible feed cards, extracts the post commentary/body, compares that text with enabled policies, and hides matching cards. It does not click controls, automate scrolling, react to posts, or make network requests to LinkedIn.

Social websites regularly change their HTML. If filtering stops working after a site update, please open a GitHub issue with the browser version, affected URL type, and a sanitized description of the visible post structure. Do not include private post content or account information.

## Install for development

Requirements:

- Firefox 115 or newer
- A local copy of this repository

Steps:

1. Open `about:debugging#/runtime/this-firefox` in Firefox.
2. Select **Load Temporary Add-on**.
3. Choose `manifest.json` from this repository.
4. Open X/Twitter or LinkedIn and refresh the tab.
5. Use the extension popup or Firefox's Add-ons Manager to open settings.

Temporary extensions are removed when Firefox closes. For persistent installation, use a signed build from Mozilla Add-ons or sign your own package.

## Using Quiet Feed

### Policies

Open **Settings → Policies** to add or edit a policy. Enter one keyword or phrase per line and choose a match rule:

- **Any keyword:** hide a post if at least one keyword matches.
- **All keywords:** hide a post only if every keyword matches.

Matching is case-insensitive. Persian Arabic-character variants and zero-width joiners are normalized before comparison. Short Latin terms such as `AI` use token boundaries to avoid matching unrelated words such as `said`.

### Sites

Open **Settings → Sites** to enable or disable a site. A custom site requires:

- A display name
- One or more hostnames without `https://`
- One or more CSS selectors identifying the complete post container

Custom sites use the generic selector-based filter. LinkedIn's bundled entry uses its specialized viewport implementation.

### Blocked activity

When history is enabled, Quiet Feed stores the most recent 2,000 blocked entries locally. Each entry may contain the site, policy, timestamp, post text, and original link when discoverable. The history screen supports search, site filtering, JSON export, CSV export, and deletion.

Disabling history stops new detailed entries, while the total blocked counter continues to increment.

## Privacy and permissions

Quiet Feed requests:

- `storage` to save settings, counters, and optional blocked history.
- `<all_urls>` so user-created site configurations can work without shipping a new extension version.

Page text is processed locally and is not transmitted. See [PRIVACY.md](PRIVACY.md) for the complete policy.

## Project structure

```text
background/          Installation, storage initialization, and blocked logging
content/             Page filtering engine and injected styles
icons/               Extension artwork and source SVG
options/             Policy, site, preference, and activity management UI
popup/               Toolbar popup and blocked counter
scripts/             Packaging utilities
shared/              Defaults, schema migration, and browser compatibility bridge
manifest.json        Firefox WebExtension manifest
PRIVACY.md           Publication privacy policy
LICENSE              MIT license
```

The filtering and interface code uses WebExtensions APIs through `shared/compat.js`. A future Chromium Manifest V3 package can reuse the shared settings, content, popup, and options code while replacing the manifest and background declaration.

## Build a release package

Run:

```sh
./scripts/package.sh
```

The script creates `web-ext-artifacts/quiet-feed-<version>.zip`.

## Contributing

Bug reports and pull requests are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) before contributing and report security-sensitive issues according to [SECURITY.md](SECURITY.md).

Participation is governed by the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

Quiet Feed is licensed under the [MIT License](LICENSE).
