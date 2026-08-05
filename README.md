# Quiet Feed

Quiet Feed is an open-source Firefox extension that hides social media posts based on user-defined keyword policies.

The main reason I wrote this extension was that my Twitter and LinkedIn feeds had been completely fucked up by an overwhelming amount of bullshit and garbage about things people and LinkedIn influencers had done with AI agents, talking about them as if they had just reinvented the fucking wheel

## Features

- Hide posts containing configured keywords or phrases.
- Create, edit, delete, enable, and disable policies.
- Enable or disable each supported site independently.
- Add other sites with hostnames and post-container CSS selectors.
- Filter dynamically loaded feeds without reloading the page.
- Scan LinkedIn posts only as they enter the viewport while scrolling.
- Display a persistent blocked-post counter in the popup.
- Keep an optional, bounded local blocked-content history.
- Search and filter blocked history by text, policy, or site.
- Export filtered history as JSON or CSV.
- Show optional placeholders where posts were hidden.

## Included policy

The default enabled policy filters common English and Persian AI bulshits.

## Supported sites
Twitter and Linkedin

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

## Using Quiet Feed

### Policies

Open **Settings → Policies** to add or edit a policy. Enter one keyword or phrase per line and choose a match rule:

- **Any keyword:** hide a post if at least one keyword matches.
- **All keywords:** hide a post only if every keyword matches.

## Privacy and permissions

Quiet Feed requests:

- `storage` to save settings, counters, and optional blocked history.
- `<all_urls>` so user-created site configurations can work without shipping a new extension version.

## License

Quiet Feed is licensed under the [MIT License](LICENSE).
