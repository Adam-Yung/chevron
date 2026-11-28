# scripts/icons/sources.mjs

The icon sources of `add-icon.mjs`, each tried in order until one answers.

**For a domain:**

1. Simple Icons: brand SVGs for thousands of tech brands, fetched from raw GitHub to avoid Cloudflare bot-blocking on the CDN.
2. The site's own `/favicon.svg`: some modern sites serve vector favicons.
3. Google's favicon service: the raster fallback.

**For a search phrase:**

1. Iconify: REST search across many icon sets, no key. The icon is read from the JSON data API (`/{prefix}.json?icons={name}`) because
   the SVG CDN endpoint returns intermittent 500s.
2. Game Icons (game-icons.net) from raw GitHub: games, fantasy, food, animals and general symbols.
3. A fuzzy match on Simple Icons brand titles.

The brand list and the Game Icons index are fetched once per run. The brand colour comes from the Simple Icons list (domains only),
else from the colours in the fetched SVG; a failed brand lookup is not an error.
