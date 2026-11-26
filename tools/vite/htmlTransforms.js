// Pure HTML transforms for the static (single-file, file://) build profile. Kept apart from vite.config.js so they are unit-tested.
// docs/code/tools/vite/htmlTransforms.js.md explains why each rewrite exists.

const SCRIPT_CROSSORIGIN = /<script\b([^>]*?)\s+crossorigin\b/g
const MODULE_SCRIPT = /<script\s+type="module"\s+/g
const MODULE_PRELOAD = /<link\s+rel="modulepreload"[^>]*>\s*/g
const APP_SCRIPT = /<script\b[^>]*\bsrc="[^"]*\/assets\/[^"]+\.js"[^>]*><\/script>\s*/

/**
 * Make the built HTML loadable from file:// as a classic script.
 * @param {string} html
 * @returns {string}
 */
export function stripModuleMarkersFromHtml(html) {
  return html
    .replace(SCRIPT_CROSSORIGIN, '<script$1')
    .replace(MODULE_SCRIPT, '<script defer ')
    .replace(MODULE_PRELOAD, '')
}

/**
 * Move the app bundle's <script> to the end of <body>, after config.js and icons.js.
 * @param {string} html
 * @returns {string}
 */
export function moveAppScriptToBodyEnd(html) {
  const match = html.match(APP_SCRIPT)
  if (!match || !html.includes('</body>')) return html
  const tag = match[0].trim().replace(/\s+defer\b/, '')
  return html.replace(match[0], '').replace('</body>', `${tag}\n</body>`)
}

const FONT_LINKS = /<link\s+rel="(?:stylesheet|preload)"\s+href="font\.css"[^>]*>\s*|<link\s+rel="preload"\s+href="fonts\/[^"]+"[^>]*>\s*/g

/**
 * Replace the font stylesheet and preload with an inline @font-face whose font is a data URL: a page opened from file:// is not
 * allowed to fetch font files, so the static build must carry its font inside the HTML.
 * @param {string} html
 * @param {string} fontCss  public/font.css
 * @param {Record<string, string>} fontsBase64  url as written in font.css -> base64 of the file
 */
export function inlineFonts(html, fontCss, fontsBase64) {
  const css = Object.entries(fontsBase64).reduce(
    (text, [url, b64]) => text.split(url).join(`data:font/woff2;base64,${b64}`),
    fontCss.replace(/\/\*[\s\S]*?\*\//g, '').trim()
  )
  if (!html.includes('href="font.css"')) return html
  return html.replace(FONT_LINKS, '').replace('</head>', `<style>${css}</style>\n</head>`)
}

/**
 * Both static-profile transforms in the order the build needs them.
 * @param {string} html
 * @returns {string}
 */
export function prepareStaticHtml(html) {
  return moveAppScriptToBodyEnd(stripModuleMarkersFromHtml(html))
}
