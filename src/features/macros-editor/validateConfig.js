import { findForbiddenUrls } from '../../storage/macrosConfig'
import { normaliseConfig } from './configDraft'

const FIELD_LABELS = { name: 'name', url: 'URL', normalisedURL: 'normalised URL', category: 'category', key: 'hotkey' }

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === ''
}

function macroLabel(macro, index) {
  return `Macro "${macro?.name || 'unnamed'}" (#${index + 1})`
}

function engineLabel(engine, id) {
  return `Engine "${engine?.name || id}" (${id})`
}

// Turns a findForbiddenUrls path such as `macros[2].commands.go.template` into words a person can find in the editor.
function describePath(path, cfg) {
  const macro = /^macros\[(\d+)\]\.?(.*)$/.exec(path)
  if (macro) {
    const index = Number(macro[1])
    const command = /^commands\.([^.]+)\.template$/.exec(macro[2])
    const field = command ? `command "${command[1]}" template` : FIELD_LABELS[macro[2]] || macro[2]
    return `${macroLabel(cfg.macros[index], index)}, ${field}`
  }
  const engine = /^engines\.([^.]+)\.?(.*)$/.exec(path)
  if (engine) {
    const type = /^types\.([^.]+)\.template$/.exec(engine[2])
    const field = type ? `query type "${type[1]}" template` : engine[2] || 'value'
    return `${engineLabel(cfg.engines[engine[1]], engine[1])}, ${field}`
  }
  return path
}

function macroProblems(macro, index) {
  const label = macroLabel(macro, index)
  const errors = []
  if (isBlank(macro?.name)) errors.push(`${label}: the name is empty.`)
  if (isBlank(macro?.url)) errors.push(`${label}: the URL is empty.`)
  return errors
}

function engineProblems(engine, id) {
  const label = engineLabel(engine, id)
  const errors = []
  if (isBlank(engine?.name)) errors.push(`${label}: the name is empty.`)
  for (const [type, body] of Object.entries(engine?.types || {})) {
    if (isBlank(body?.template)) errors.push(`${label}: query type "${type}" has no template.`)
  }
  return errors
}

function commandProblems(command, index) {
  return isBlank(command?.type) ? [`Command #${index + 1}: the type is empty.`] : []
}

// First macro wins a trigger, so a duplicate silently shadows the later macro; worth a warning, not a block.
function duplicateTriggerWarnings(macros) {
  const owners = new Map()
  const warnings = []
  macros.forEach((macro, index) => {
    for (const trigger of Array.isArray(macro?.triggers) ? macro.triggers : []) {
      const first = owners.get(trigger)
      if (first === undefined) owners.set(trigger, index)
      else warnings.push(`Trigger "${trigger}" is used by ${macroLabel(macros[first], first)} and ${macroLabel(macro, index)}; only the first one matches.`)
    }
  })
  return warnings
}

/**
 * Blocking errors stop a save; warnings are shown but never block. Every message names the macro, command or engine and the field.
 */
export function validateConfig(config) {
  const cfg = normaliseConfig(config)
  const errors = [
    ...findForbiddenUrls(cfg).map(path => `${describePath(path, cfg)}: URLs starting with javascript:, data:, vbscript: or file: are not allowed.`),
    ...cfg.macros.flatMap(macroProblems),
    ...cfg.commands.flatMap(commandProblems),
    ...Object.entries(cfg.engines).flatMap(([id, engine]) => engineProblems(engine, id))
  ]
  return { errors, warnings: duplicateTriggerWarnings(cfg.macros) }
}
