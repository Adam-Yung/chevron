// Pure HTML transforms for the build profiles (mostly the static, single-file, file:// one). Kept apart from vite.config.js so they are unit-tested.
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

const stripCssComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '').trim()

const FONT_STYLESHEET = /<link\s+rel="stylesheet"\s+href="font\.css"[^>]*>\s*/

/**
 * Hosted profile: put public/font.css inline where its <link> stood. The stylesheet only declares @font-face, yet as a separate file
 * it blocked first paint for a whole round-trip. The font file itself stays external, cached, and preloaded.
 * @param {string} html
 * @param {string} fontCss  public/font.css
 */
export function inlineFontCss(html, fontCss) {
  if (!FONT_STYLESHEET.test(html)) return html
  return html.replace(FONT_STYLESHEET, `<style>${stripCssComments(fontCss)}</style>\n`)
}

const APP_STYLESHEETS = /<link\s+rel="stylesheet"[^>]*\bhref="[^"]*assets\/[^"]+\.css"[^>]*>\s*/g
const FIRST_BODY_SCRIPT = /<script\s+src="config\.js/

/**
 * Hosted profile: move the app's stylesheets from <head> into <body>, just before config.js. In <head> they held back the first
 * paint, the shell included, for a whole download; in <body> they block only what follows them, and the scripts after them still
 * wait for them, so the app never mounts unstyled.
 * @param {string} html
 * @returns {string}
 */
export function moveAppStylesheetsAfterShell(html) {
  const links = html.match(APP_STYLESHEETS)
  if (!links || !FIRST_BODY_SCRIPT.test(html)) return html
  const tags = links.map(l => l.trim()).join('\n    ')
  return html.replace(APP_STYLESHEETS, '').replace(FIRST_BODY_SCRIPT, m => `${tags}\n    ${m}`)
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
    stripCssComments(fontCss)
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
