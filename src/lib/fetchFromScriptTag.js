/**
 * JSONP-style fetch via an injected <script>. The caller supplies a callback name that is
 * unique per call (a shared name would let one response resolve another request), so a name
 * already in use rejects instead of clobbering the request that owns it.
 *
 * Every path (response, load error, timeout, failed insert) removes both the global
 * callback and the script node; offline typing would otherwise leak both per keystroke.
 */
export default function fetchFromScriptTag(url, callbackName, { timeoutMs = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    if (Object.hasOwn(window, callbackName)) {
      reject(new Error(`fetchFromScriptTag: callback ${callbackName} already in use`))
      return
    }

    const script = document.createElement('script')
    let settled = false

    const settle = (finish, value) => {
      if (settled) return
      settled = true
      clearTimeout(timeoutId)
      delete window[callbackName]
      script.remove()
      finish(value)
    }
    const timeoutId = setTimeout(
      () => settle(reject, new Error(`fetchFromScriptTag: timeout after ${timeoutMs}ms (${url})`)),
      timeoutMs,
    )

    window[callbackName] = response => settle(resolve, response)
    script.onerror = () => settle(reject, new Error(`fetchFromScriptTag: script load failed (${url})`))
    script.src = url
    try {
      document.head.appendChild(script)
    } catch (err) {
      settle(reject, err)
    }
  })
}
