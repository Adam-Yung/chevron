// What a piece of text means as a destination: a macro, a macro command, a URL, an instant answer, or a search. Pure.
// docs/code/src/search/resolve.js.md explains the precedence.
import isValidURL from '../lib/isValidURL'
import normaliseURL from '../lib/normaliseURL'
import randomHSLColor from '../lib/randomHSLColor'

const URL_TEXT_COLOR = '#f2f2f2'
const LOCAL_URL = /^(https?:\/\/)?(localhost|\d{1,3}(\.\d{1,3}){3}|\[[\da-f:]+\])(:\d+)?(\/\S*)?$/i
// `node.js`, `setup.py`, `readme.md` are searches, not sites, unless typed with a scheme or a path.
const FILE_LIKE = /^[^/:]+\.(js|mjs|ts|tsx|jsx|py|rs|md|sh|json|txt|css|html|cpp|java|rb|php|lua|exe|dll|toml|yaml|yml|csv|xml|log)$/i
const NO_ENGINE = { name: '', bgColor: { type: 'solid', color: '#888' }, textColor: '#fff', types: { query: { template: '' } } }

/** @param {string} text */
export function looksLikeUrl(text) {
  const t = text.trim()
  if (!t || /\s/.test(t) || FILE_LIKE.test(t)) return false
  return LOCAL_URL.test(t) || isValidURL(t)
}

function findCommand(rest, commands) {
  let best = null
  for (const command of commands ?? []) {
    if (!rest.startsWith(command.trigger)) continue
    if (!best || command.trigger.length > best.trigger.length) best = command
  }
  return best && { type: best.type, args: rest.slice(best.trigger.length) }
}

// The longest macro trigger followed by a command trigger that macro defines.
function findMacroCommand(text, macros, commands) {
  let best = null
  for (const macro of macros) {
    for (const trigger of macro.triggers ?? []) {
      if (!text.startsWith(trigger) || (best && trigger.length <= best.trigger.length)) continue
      const command = findCommand(text.slice(trigger.length), commands)
      if (command && macro.commands?.[command.type]) best = { macro, command, trigger }
    }
  }
  return best && { macro: best.macro, command: best.command }
}

/** The macro a query names, plus its command when the query continues with a command trigger that macro defines. */
export function findMacro(text, config) {
  const macros = config?.macros ?? []
  const exact = macros.find(m => m.triggers?.includes(text))
  return exact ? { macro: exact, command: null } : findMacroCommand(text, macros, config?.commands)
}

function fill(template, at, dollar) {
  return template.replace('{@}', at).replace('{$}', dollar)
}

function searchDestination(text, { engine, type, origin }) {
  const types = engine.types ?? {}
  const template = (types[type] ?? types.query ?? NO_ENGINE.types.query).template
  return {
    kind: 'search',
    url: fill(template, encodeURIComponent(origin ?? text), encodeURIComponent(text)),
    label: 'search',
    marquee: engine.name,
    bgColor: engine.bgColor,
    textColor: engine.textColor
  }
}

function macroDestination({ macro, command }) {
  const base = { kind: 'macro', url: macro.url, label: macro.name, marquee: macro.name, bgColor: macro.bgColor, textColor: macro.textColor, macro }
  if (!command) return base
  const spec = macro.commands[command.type]
  return {
    ...base,
    kind: 'command',
    url: fill(spec.template, macro.url, encodeURIComponent(command.args)),
    label: spec.description || command.type
  }
}

function urlDestination(text, config, colorScheme) {
  const domain = normaliseURL(text) || text
  const owner = (config?.macros ?? []).find(m => m.normalisedURL && m.normalisedURL === domain)
  if (owner) return { kind: 'url', url: text, label: owner.name, marquee: owner.name, bgColor: owner.bgColor, textColor: owner.textColor, macro: owner }
  const dark = colorScheme === 'dark'
  return {
    kind: 'url',
    url: text,
    label: 'go to',
    marquee: domain,
    bgColor: { type: 'gradient', gradientType: 'linear', colors: [randomHSLColor(domain, dark), randomHSLColor(domain + '1', dark)] },
    textColor: URL_TEXT_COLOR
  }
}

/** `text` is the query or the selected suggestion (then `origin` is the query); `forceEngine` skips macros and URLs. */
export function resolveDestination(text, options = {}) {
  const { type, config, forceEngine, colorScheme, isAnswer = () => false } = options
  const engine = options.engine ?? NO_ENGINE
  if (type && isAnswer(type)) return { ...searchDestination(text, { engine, type, origin: options.origin }), kind: 'answer', label: type }
  if (!forceEngine) {
    const found = findMacro(text, config)
    if (found) return macroDestination(found)
    if (looksLikeUrl(text)) return urlDestination(text.trim(), config, colorScheme)
  }
  return searchDestination(text, { engine, type: 'query', origin: options.origin })
}
