// Imported first by main.jsx: ES imports run before the importing module's body, and settings/schema.js reads
// window.CONFIG.engines while it is imported, so the user's saved config must be applied by an import that precedes it.
import { applyPersistedConfigToWindow } from './macrosConfig'

applyPersistedConfigToWindow()
