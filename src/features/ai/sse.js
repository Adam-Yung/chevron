// Server-sent-event plumbing for OpenAI-style streams.

function feedLine(line, onData) {
  const trimmed = line.trim()
  if (trimmed.startsWith('data:')) onData(trimmed.slice(5).trim())
}

// Network chunks end anywhere, so only complete lines are parsed and the rest waits: parsing each chunk on its own drops tokens
// whenever a boundary splits a JSON payload.
export function createSseReader(onData) {
  let buffer = ''
  return {
    push(chunk) {
      const lines = (buffer + chunk).split('\n')
      buffer = lines.pop()
      for (const line of lines) feedLine(line, onData)
    },
    end() {
      feedLine(buffer, onData)
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
