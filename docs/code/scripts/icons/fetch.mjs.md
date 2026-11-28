# scripts/icons/fetch.mjs

HTTP GET with redirects and a 10 s timeout, used by `sources.mjs`. It uses Node's `https` module with an agent that does **not verify
certificates** (`rejectUnauthorized: false`), so that it works behind corporate proxies such as Zscaler that inject self-signed
certificates. The cost: anyone on the network path can substitute the SVG that ends up in `public/icons.js`.
