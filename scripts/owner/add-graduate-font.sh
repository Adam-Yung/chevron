#!/usr/bin/env bash
# Adds the Graduate display face (OFL, Google Fonts) used by the Sleeve Patch look. Until it is added the UI falls back to a slab
# serif from the system. Run from anywhere; it changes public/fonts/, public/font.css and index.html.
set -euo pipefail
cd "$(dirname "$0")/../.."
grep -q "font-family: 'Graduate'" public/font.css && { echo "Graduate is already in public/font.css"; exit 0; }
agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36'
url=$(curl -sSf -A "$agent" 'https://fonts.googleapis.com/css2?family=Graduate&display=swap' |
  awk '/U\+0000-00FF/ {print last} /src:/ {last=$0}' | sed -E 's/.*url\(([^)]+)\).*/\1/')
case "$url" in https://fonts.gstatic.com/*.woff2) ;; *) echo "unexpected font url: $url" >&2; exit 1 ;; esac
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT
curl -sSf "$url" -o "$tmp/Graduate.woff2"
[ "$(head -c 4 "$tmp/Graduate.woff2")" = wOF2 ] || { echo "not a woff2 file" >&2; exit 1; }
mkdir -p public/fonts/Graduate
mv "$tmp/Graduate.woff2" public/fonts/Graduate/Graduate.woff2
cat >> public/font.css <<'CSS'

/* Graduate (OFL), Latin subset: the display face. */
@font-face {
  font-family: 'Graduate';
  src: url('./fonts/Graduate/Graduate.woff2') format('woff2');
  font-display: swap;
}
CSS
# Preload it, so the first typed letters are not drawn and measured in the fallback face.
perl -pi -e 's|^(\s*)(<link rel="preload" href="fonts/Onest/.*)$|$1$2\n$1<link rel="preload" href="fonts/Graduate/Graduate.woff2" as="font" type="font/woff2" crossorigin>|' index.html
shasum -a 256 public/fonts/Graduate/Graduate.woff2
