#!/usr/bin/env sh
set -eu
root_dir=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
output_dir="$root_dir/web-ext-artifacts"
mkdir -p "$output_dir"
cd "$root_dir"
version=$(sed -n 's/^[[:space:]]*"version":[[:space:]]*"\([^"]*\)".*/\1/p' manifest.json | head -n 1)
if [ -z "$version" ]; then
  printf '%s\n' "Could not read the extension version from manifest.json" >&2
  exit 1
fi
archive="$output_dir/quiet-feed-$version.zip"
zip -r -FS "$archive" manifest.json background content icons/icon-48.png icons/icon-96.png options popup shared -x '*.DS_Store'
printf '%s\n' "$archive"
