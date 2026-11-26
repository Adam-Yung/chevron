// Finds playwright-core without installing it; see the header of scripts/e2e/run.mjs for the search order.
import { createRequire } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

function candidates(root) {
  const local = join(root, 'scripts', 'e2e', 'playwright-path.local')
  return [
    process.env.PLAYWRIGHT_CORE,
    existsSync(local) ? readFileSync(local, 'utf8').trim() : null,
    'playwright-core'
  ].filter(Boolean)
}

export async function loadChromium(root) {
  const require = createRequire(join(root, 'package.json'))
  for (const id of candidates(root)) {
    try {
      return require(id).chromium
    } catch {
      // try the next location
    }
  }
  return null
}
