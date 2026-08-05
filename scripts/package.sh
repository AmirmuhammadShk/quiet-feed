#!/usr/bin/env sh

# Build a versioned, distributable ZIP archive of the browser extension.
# Run from any directory with: ./scripts/package.sh
set -eu

# Resolve paths relative to this script so packaging does not depend on the
# caller's current working directory.
root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
output_dir="$root_dir/web-ext-artifacts"
mkdir -p "$output_dir"
cd "$root_dir"

# Keep the archive filename in sync with the version declared in the manifest.
version=$(sed -n 's/^[[:space:]]*"version":[[:space:]]*"\([^"]*\)".*/\1/p' manifest.json | head -n 1)
if [ -z "$version" ]; then
  printf '%s\n' "Could not read the extension version from manifest.json" >&2
  exit 1
fi

# Package only runtime files. -FS updates an existing archive while removing
# entries that are no longer present, and excludes macOS metadata files.
archive="$output_dir/quiet-feed-$version.zip"
zip -r -FS "$archive" manifest.json background content icons/icon-48.png icons/icon-96.png options popup shared -x '*.DS_Store'

# Print the artifact path for humans and calling automation.
printf '%s\n' "$archive"
