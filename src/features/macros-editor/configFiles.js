import { CONFIG_SCHEMA_VERSION } from '../../storage/macrosConfig'
import { pretty } from './configDraft'

export const EXPORT_FILENAME = 'chevron-config.json'

export function downloadConfig(config) {
  const blob = new Blob([pretty({ version: CONFIG_SCHEMA_VERSION, ...config })], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = EXPORT_FILENAME
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function readJsonFile(file) {
  return JSON.parse(await file.text())
}
