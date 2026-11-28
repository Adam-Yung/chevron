# scripts/icons/svg.mjs

Pure SVG handling for `add-icon.mjs`. `sanitiseSvg` tidies markup (preamble, comments, title, line breaks, default fill); it is
**not** a security sanitiser: scripts and event attributes pass through, and the app inserts icons with `innerHTML`. Colour
suggestions skip black and white, which are rarely a brand colour.
