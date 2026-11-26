// Server-sent-event plumbing for OpenAI-style streams.

/**
 * Line-buffered SSE reader. Network chunks end anywhere, including mid-line, so only complete lines are parsed and the
 * remainder waits for the next chunk; parsing each chunk on its own drops tokens whenever a boundary splits a JSON payload.
 */
export function createSseReader(onData) {
  let buffer = ''
  const feed = line => {
    const trimmed = line.trim()
    if (trimmed.startsWith('data:')) onData(trimmed.slice(5).trim())
  }
  return {
    push(chunk) {
      const lines = (buffer + chunk).split('\n')
      buffer = lines.pop()
      lines.forEach(feed)
    },
    end() {
      feed(buffer)
      buffer = ''
    }
  }
}

/** Pull a readable `{ code, message }` out of an error response body (OpenAI object, Ollama string, or plain text). */
export function parseErrorBody(text, status) {
  let parsed = null
  try { parsed = JSON.parse(text) } catch { /* plain-text body */ }
  const err = parsed?.error
  const message = (typeof err === 'string' ? err : err?.message) || (parsed ? '' : text.trim().slice(0, 300))
  return { code: err?.code || status, message: message || `The server answered HTTP ${status}.` }
}
