// Keeps API keys from being readable at a glance in localStorage. Reversible obfuscation, NOT encryption: no real secrecy.
// Deterministic on purpose, so saving unchanged settings does not change the stored text.

const PREFIX = 'OBF1:'
const SALT = 'chevron.local.obfuscation'

function xorBytes(input, key) {
  const out = new Uint8Array(input.length)
  for (let i = 0; i < input.length; i++) {
    out[i] = input[i] ^ key.charCodeAt(i % key.length)
  }
  return out
}

export function obfuscate(plaintext) {
  if (!plaintext) return plaintext
  if (isObfuscated(plaintext)) return plaintext
  const bytes = new TextEncoder().encode(plaintext)
  const xored = xorBytes(bytes, SALT)
  return PREFIX + btoa(String.fromCharCode(...xored))
}

export function deobfuscate(stored) {
  if (!stored || !isObfuscated(stored)) return stored
  try {
    const b64 = stored.slice(PREFIX.length)
    const raw = Uint8Array.from(atob(b64), c => c.charCodeAt(0))
    const xored = xorBytes(raw, SALT)
    const decoded = new TextDecoder().decode(xored)
    // Non-printable output means another salt wrote it: return empty so the user is asked for the key again.
    if (/[^\x20-\x7e]/.test(decoded)) return ''
    return decoded
  } catch {
    return ''
  }
}

function isObfuscated(value) {
  return typeof value === 'string' && value.startsWith(PREFIX)
}
