// Provider-agnostic streaming chat completion client. Talks to any
// endpoint that exposes the OpenAI v1 SSE schema at
// `${baseURL}/chat/completions` (OpenAI, Ollama in OpenAI-compat mode,
// LM Studio, llama.cpp server, vLLM, etc.).
const DEFAULTS = {
  temperature: 0.4,
  stream: true,
  // max_tokens: 4096,
  // frequency_penalty: 1.0,
}

function buildUrl(baseURL) {
  // Tolerate trailing slashes and trailing `/v1` so users can paste in
  // either `http://host:port` or `http://host:port/v1`.
  const trimmed = String(baseURL || '').trim().replace(/\/+$/, '')
  if (/\/v\d+$/i.test(trimmed)) return `${trimmed}/chat/completions`
  return `${trimmed}/v1/chat/completions`
}

function createCompletion(stateSetter, messages, temperature, providerConfig) {
  const { baseURL, model, apiKey } = providerConfig
  const controller = new AbortController()

  const headers = { 'Content-Type': 'application/json' }
  // Authorization is optional: OpenAI requires it, Ollama / LM Studio
  // typically don't.
  if (apiKey) headers['Authorization'] = 'Bearer ' + String(apiKey)

  return ({
    controller,
    promise: new Promise((resolve, reject) => {
      fetch(buildUrl(baseURL), {
        signal: controller.signal,
        method: 'POST',
        headers,
        body: JSON.stringify({ ...DEFAULTS, model, messages, temperature })
      })
      .then(result => {
        fetchStream(
          result.body,
          result.ok ? dataParser(stateSetter) : errorParser)
        .then(content => {
          result.ok
            ? resolve({ content, role: 'assistant' })
            : reject(content)
        })
      })
      .catch(err => {
        // network error / DNS / aborted before headers
        if (err?.name === 'AbortError') return
        reject({ code: 'network', message: err?.message || String(err) })
      })
    })
  })
}

function fetchStream(stream, parser) {
  let content = null
  const reader = stream.getReader()
  // Hoist the decoder so we don't allocate one per chunk and so it can
  // correctly handle multi-byte sequences split across chunks.
  const decoder = new TextDecoder('utf-8')

  // read() returns a promise that resolves
  // when a value has been received
  return reader.read().then(
    function processText({ done, value }) {
      // Result objects contain two properties:
      // done  - true if the stream has already given you all its data.
      // value - some data. Always undefined when done is true.
      if (done) {
        // flush any buffered bytes before completing
        const tail = decoder.decode()
        if (tail) content = parser(tail, content)
        return content
      }

      const decoded = decoder.decode(value, { stream: true })
      content = parser(decoded, content)

      return reader.read().then(processText)
    }
  )
}

function dataParser(stateSetter) {
  return (data, acc) => {
    for (const entry of data.split('\n'))
      if (entry) {
        const text = entry.slice(entry.indexOf(':') + 2)
        // OpenAI/Ollama signal stream end with the literal "[DONE]"
        if (text === '[DONE]') continue
        let response
        try {
          response = JSON.parse(text)
        } catch (error) { /* pass */ }

        if (response && typeof response.choices?.[0]?.delta?.content === 'string') {
          if (typeof acc === 'string')
            acc += response.choices[0].delta.content
          else
            acc = response.choices[0].delta.content

          stateSetter(acc)
        }
      }

    return acc
  }
}

function errorParser(data, acc) {
  if (!acc) acc = {}
  let parsed
  try {
    parsed = JSON.parse(data)
  } catch (e) {
    // non-JSON error body (e.g. Ollama plaintext); just accumulate text
    acc.code = acc.code || 'error'
    acc.message = (acc.message || '') + data
    return acc
  }

  // OpenAI shape: { error: { code, message } }
  // Ollama shape: { error: "message" }
  const err = parsed.error
  if (err && typeof err === 'object') {
    acc.code = err.code || acc.code || 'error'
    acc.message = (acc.message ? acc.message : '') + (err.message || '')
  } else if (typeof err === 'string') {
    acc.code = acc.code || 'error'
    acc.message = (acc.message ? acc.message : '') + err
  } else {
    acc.code = acc.code || 'error'
    acc.message = (acc.message ? acc.message : '') + (data || '')
  }

  return acc
}

export default createCompletion
