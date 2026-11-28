// Opening a destination. Called synchronously from the key or click handler: popup blockers only allow window.open inside a user
// gesture, and same-tab navigation should start before any animation, not after it.
const FORBIDDEN_SCHEME = /^\s*(javascript|data|vbscript|file):/i
// A scheme is letters then ':' not followed by a digit, so `localhost:3000` reads as host and port, not as scheme `localhost`.
const HAS_SCHEME = /^[a-z][a-z\d+.-]*:(?!\d)/i
// Local hosts rarely serve TLS; guessing https for them fails where http works.
const LOCAL_HOST = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\]|[\w-]+\.local\b)/i

/** Turns a resolved destination into something window.open accepts, or null when it must not be opened. */
export function toHref(url) {
  const trimmed = url?.trim()
  if (!trimmed || FORBIDDEN_SCHEME.test(trimmed)) return null
  if (HAS_SCHEME.test(trimmed)) return trimmed
  return (LOCAL_HOST.test(trimmed) ? 'http://' : 'https://') + trimmed
}

/** @returns {'new-tab' | 'leaving' | 'blocked'} */
export function openDestination(url, { newTab = false, win = window } = {}) {
  const href = toHref(url)
  if (!href) return 'blocked'
  if (newTab) {
    const opened = win.open(href, '_blank', 'noopener')
    // noopener makes window.open return null even on success, so a null here cannot tell a blocked popup from an opened one.
    return opened === undefined ? 'blocked' : 'new-tab'
  }
  win.location.assign(href)
  return 'leaving'
}
