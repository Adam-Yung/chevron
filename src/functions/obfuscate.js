// Lightweight reversible obfuscation for API keys stored in localStorage.
// NOT encryption — provides no real secrecy against a determined attacker
// with devtools access. The goal is simply to prevent casual exposure of
// raw API keys when someone inspects browser storage.
//
// Format: "OBF1:<base64(xor(plaintext, key))>"
// The XOR key is derived from a fixed salt so the same plaintext always
// produces the same ciphertext (no nonce). This is intentional: settings
// are written on every debounced save, and we don't want the stored value
// to churn on each write.

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
    // If decoding produced non-printable characters, the salt doesn't match
    // (legacy obfuscation from an older patch). Return empty so the user
    // is prompted to re-enter the key.
    if (/[^\x20-\x7e]/.test(decoded)) return ''
    return decoded
  } catch {
    return ''
  }
}

export function isObfuscated(value) {
  return typeof value === 'string' && value.startsWith(PREFIX)
}
