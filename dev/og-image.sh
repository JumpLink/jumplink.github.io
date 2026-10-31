#!/usr/bin/env bash
# Renders the share card to assets/images/og.png (1200×630) from the built site.
# Needs `npm run build` and the preview server: `npm run preview -- 8080`.
set -euo pipefail
cd "$(dirname "$0")/.."
url="${1:-http://localhost:8080}"
cp dev/og-image.html _site/og-image.html
trap 'rm -f _site/og-image.html' EXIT
google-chrome --headless=new --disable-gpu --hide-scrollbars --force-prefers-reduced-motion \
    --window-size=1200,630 --virtual-time-budget=6000 \
    --screenshot=assets/images/og.png "$url/og-image.html" 2>/dev/null
echo "assets/images/og.png"
