// Pure HTML transforms for the build profiles (mostly the static, single-file, file:// one). Kept apart from vite.config.js so they are unit-tested.
// docs/code/tools/vite/htmlTransforms.js.md explains why each rewrite exists.

const SCRIPT_CROSSORIGIN = /<script\b([^>]*?)\s+crossorigin\b/g
const MODULE_SCRIPT = /<script\s+type="module"\s+/g
const MODULE_PRELOAD = /<link\s+rel="modulepreload"[^>]*>\s*/g
const APP_SCRIPT = /<script\b[^>]*\bsrc="[^"]*\/assets\/[^"]+\.js"[^>]*><\/script>\s*/

// Make the built HTML loadable from file:// as a classic script.
export function stripModuleMarkersFromHtml(html) {
  return html
    .replace(SCRIPT_CROSSORIGIN, '<script$1')
    .replace(MODULE_SCRIPT, '<script defer ')
    .replace(MODULE_PRELOAD, '')
}

// Move the app bundle's <script> to the end of <body>, after config.js and icons.js.
export function moveAppScriptToBodyEnd(html) {
  const match = html.match(APP_SCRIPT)
  if (!match || !html.includes('</body>')) return html
  const tag = match[0].trim().replace(/\s+defer\b/, '')
  return html.replace(match[0], '').replace('</body>', `${tag}\n</body>`)
}

const stripCssComments = css => css.replace(/\/\*[\s\S]*?\*\//g, '').trim()

const FONT_STYLESHEET = /<link\s+rel="stylesheet"\s+href="font\.css"[^>]*>\s*/

// Hosted: put public/font.css (`fontCss`) inline where its <link> stood, so it stops blocking first paint.
// The font file itself stays external, cached and preloaded.
export function inlineFontCss(html, fontCss) {
  if (!FONT_STYLESHEET.test(html)) return html
  return html.replace(FONT_STYLESHEET, `<style>${stripCssComments(fontCss)}</style>\n`)
}

const APP_STYLESHEETS = /<link\s+rel="stylesheet"[^>]*\bhref="[^"]*assets\/[^"]+\.css"[^>]*>\s*/g
const FIRST_BODY_SCRIPT = /<script\s+src="config\.js/

// Hosted: move the app's stylesheets into <body>, just before config.js. The first-paint shell no longer waits for them,
// and the scripts after them still do, so the app never mounts unstyled.
export function moveAppStylesheetsAfterShell(html) {
  const links = html.match(APP_STYLESHEETS)
  if (!links || !FIRST_BODY_SCRIPT.test(html)) return html
  const tags = links.map(l => l.trim()).join('\n    ')
  return html.replace(APP_STYLESHEETS, '').replace(FIRST_BODY_SCRIPT, m => `${tags}\n    ${m}`)
}

const FONT_LINKS = /<link\s+rel="(?:stylesheet|preload)"\s+href="font\.css"[^>]*>\s*|<link\s+rel="preload"\s+href="fonts\/[^"]+"[^>]*>\s*/g

// Static: a file:// page may not fetch fonts, so inline them. `fontsBase64` maps each url as written in font.css (`fontCss`)
// to its file's base64.
export function inlineFonts(html, fontCss, fontsBase64) {
  const css = Object.entries(fontsBase64).reduce(
    (text, [url, b64]) => text.split(url).join(`data:font/woff2;base64,${b64}`),
    stripCssComments(fontCss)
  )
  if (!html.includes('href="font.css"')) return html
  return html.replace(FONT_LINKS, '').replace('</head>', `<style>${css}</style>\n</head>`)
}

// Both static-profile transforms, in the order the build needs them.
export function prepareStaticHtml(html) {
  return moveAppScriptToBodyEnd(stripModuleMarkersFromHtml(html))
}
