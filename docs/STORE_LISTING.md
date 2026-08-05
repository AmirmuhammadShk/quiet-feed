# Firefox Add-ons listing copy

This document contains publication copy for Mozilla Add-ons. Replace repository links after the GitHub repository URL is known.

## Name

Quiet Feed – Keyword Blocker

## Summary

Hide posts matching your keyword policies on X/Twitter, LinkedIn, and websites you configure.

## Description

Quiet Feed helps you remove unwanted topics from social-media feeds using keyword policies you control.

Create policies with English, Persian, or other-language keywords; choose whether any or all keywords must match; and enable or disable policies and sites independently. Quiet Feed includes an editable English and Persian policy for AI and LLM topics.

Supported features:

- X/Twitter timeline filtering
- Viewport-based LinkedIn post-body filtering
- Custom websites using configurable post selectors
- Searchable local blocked-content history
- JSON and CSV history export
- Master, policy, and site toggles
- Optional hidden-post placeholders
- Light and dark themes

Privacy is central to Quiet Feed. Filtering happens entirely inside Firefox. The extension has no server, telemetry, advertising, remote code, or external analytics. Optional history remains in local extension storage and can be disabled or cleared.

## Categories

- Primary: Privacy & Security
- Secondary, if available: Social & Communication

## License

MIT

## Data disclosure

Quiet Feed does not collect or transmit data outside the browser. Select the AMO declaration corresponding to no required or optional data collection/transmission. The manifest declares `data_collection_permissions.required` as `none`.

Local post processing and optional local blocked history are described in `PRIVACY.md` but do not constitute transmission outside the browser.

## Permission justifications

### storage

Stores user-created policies, site configuration, preferences, the blocked counter, and optional blocked history locally in Firefox.

### Access data for all websites

Allows user-created site configurations to filter posts on a hostname chosen by the user. The extension injects its filter on pages but performs work only when the hostname matches an enabled configured site. Page content is processed locally and never transmitted.

## Suggested screenshots

Use PNG or JPEG screenshots without private account information:

1. Popup showing the filtering toggle and blocked counter.
2. Policies page showing the included AI/LLM policy.
3. Policy editor with a short, non-sensitive example keyword list.
4. Sites page showing X/Twitter and LinkedIn.
5. Blocked Activity page populated with synthetic example content only.

## Reviewer notes

Quiet Feed is dependency-free and contains readable, unminified source. There is no build step, remote code, dynamic code evaluation, telemetry, or network API. `scripts/package.sh` only creates the upload ZIP.

LinkedIn is processed separately from generic sites: only visible feed cards are examined as the user scrolls, and only extracted post-body text is compared. X/Twitter uses its tweet article selector. Custom sites use selectors entered by the user.

The broad host permission is necessary for the advertised custom-site feature. The content script returns without reading page content when the current hostname does not match an enabled site configuration.
