/**
 * JSONP-style fetch via injected <script>.
 *
 * Hardened to:
 *  - Reject (rather than hang forever) if the script fails to load —
 *    this is the path hit when the user is offline.
 *  - Time out after `timeoutMs` so a server that accepts the connection
 *    but never invokes the callback can't leak the script tag forever.
 *  - Always clean up `window[callbackName]` and the <script> node, on
 *    success, error, or timeout. Without this, typing while offline
 *    would accumulate dead script nodes + global callback functions.
 */
export default function fetchFromScriptTag(url, callbackName, { timeoutMs = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    let settled = false
    const script = document.createElement('script')

    const cleanup = () => {
      try { delete window[callbackName] } catch { window[callbackName] = undefined }
      if (script.parentNode) script.parentNode.removeChild(script)
    }

    const timeoutId = setTimeout(() => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error(`fetchFromScriptTag: timeout after ${timeoutMs}ms (${url})`))
    }, timeoutMs)

    window[callbackName] = res => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      cleanup()
      resolve(res)
    }

    script.onerror = () => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      cleanup()
      reject(new Error(`fetchFromScriptTag: script load failed (${url})`))
    }

    script.src = url
    document.head.appendChild(script)
  })
}
