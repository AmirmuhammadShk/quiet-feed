# Contributing to Quiet Feed

Thank you for helping improve Quiet Feed.

All contributors must follow the project's [Code of Conduct](CODE_OF_CONDUCT.md).

## Reporting bugs

Search existing issues before opening a new one. Include:

- Firefox and Quiet Feed versions
- The affected site and page type
- Expected and actual behavior
- Reproduction steps
- Relevant console errors, if available

Never include authentication tokens, private messages, private post text, or personally identifying account data.

## Pull requests

1. Create a focused branch from the current default branch.
2. Keep changes small and avoid unrelated formatting rewrites.
3. Preserve local-only processing and avoid new permissions unless essential.
4. Test both X/Twitter and LinkedIn when changing shared filtering code.
5. Update documentation and `CHANGELOG.md` for user-visible changes.
6. Run Mozilla's `web-ext lint` when available.
7. Explain the behavior, risks, and manual verification in the pull request.

## Code style

- Use plain JavaScript, CSS, and HTML without a required runtime build step.
- Prefer standard WebExtensions APIs and keep future Chromium portability in mind.
- Render captured page content with `textContent`, never `innerHTML`.
- Keep all matching and history storage local.
- Avoid selectors that encompass an entire feed or page.
- Keep LinkedIn filtering viewport-based and limited to post-body text.

By contributing, you agree that your contribution is licensed under the project's MIT License.
