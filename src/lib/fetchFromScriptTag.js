function once(fn) {
  let done = false
  return (...args) => {
    if (done) return
    done = true
    fn(...args)
  }
}

/** JSONP through an injected <script>. `callbackName` must be unique per call; every outcome removes it and the node. */
export default function fetchFromScriptTag(url, callbackName, { timeoutMs = 5000 } = {}) {
  return new Promise((resolve, reject) => {
    if (Object.hasOwn(window, callbackName)) {
      reject(new Error(`fetchFromScriptTag: callback ${callbackName} already in use`))
      return
    }

    const script = document.createElement('script')

    // Response, load error, timeout and failed insert: whichever comes first cleans up for all of them.
    const settle = once((finish, value) => {
      clearTimeout(timeoutId)
      delete window[callbackName]
      script.remove()
      finish(value)
    })
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
