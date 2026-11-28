import { afterEach, describe, expect, it, vi } from 'vitest'
import createCompletion from './createCompletion'

const config = { baseURL: 'http://localhost:11434', model: 'm', apiKey: '' }
const enc = new TextEncoder()

function streamOf(chunks) {
  return new ReadableStream({
    start(controller) {
      chunks.forEach(c => controller.enqueue(enc.encode(c)))
      controller.close()
    }
  })
}

const delta = t => `data: ${JSON.stringify({ choices: [{ delta: { content: t } }] })}\n\n`

const run = (overrides = {}) => createCompletion({
  messages: [], temperature: 0.4, config, signal: new AbortController().signal, onText: () => {}, ...overrides
})

afterEach(() => vi.unstubAllGlobals())

describe('createCompletion', () => {
  it('streams progressively and survives a chunk split mid-payload', async () => {
    const full = delta('Hel') + delta('lo') + 'data: [DONE]\n\n'
    const cut = full.indexOf('lo') + 3
    vi.stubGlobal('fetch', async () => ({ ok: true, body: streamOf([full.slice(0, cut), full.slice(cut)]) }))
    const seen = []
    const reply = await run({ onText: t => seen.push(t) })
    expect(seen).toEqual(['Hel', 'Hello'])
    expect(reply).toEqual({ content: 'Hello', role: 'assistant' })
  })

  it('posts to /v1/chat/completions without an Authorization header when no key is set', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, body: streamOf(['data: {"choices":[{"delta":{"content":"x"}}]}\n']) }))
    vi.stubGlobal('fetch', fetchMock)
    await run()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:11434/v1/chat/completions')
    expect(init.headers.Authorization).toBeUndefined()
  })

  it('rejects an HTTP 401 with the server message', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: false, status: 401, text: async () => '{"error":{"message":"Bad key"}}' }))
    await expect(run()).rejects.toMatchObject({ message: 'Bad key' })
  })

  it('reports a network failure readably', async () => {
    vi.stubGlobal('fetch', async () => { throw new TypeError('Failed to fetch') })
    await expect(run()).rejects.toMatchObject({ code: 'network' })
  })

  it('reports a stream with no usable data as an error', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, body: streamOf(['data: <<garbage>>\n\n']) }))
    await expect(run()).rejects.toMatchObject({ code: 'empty' })
  })

  it('surfaces an error object sent inside the stream', async () => {
    vi.stubGlobal('fetch', async () => ({ ok: true, body: streamOf(['data: {"error":{"message":"overloaded"}}\n\n']) }))
    await expect(run()).rejects.toMatchObject({ message: 'overloaded' })
  })

  it('does not report text after the signal aborted', async () => {
    const controller = new AbortController()
    vi.stubGlobal('fetch', async () => ({ ok: true, body: streamOf(['data: {"choices":[{"delta":{"content":"late"}}]}\n']) }))
    const seen = []
    controller.abort()
    await run({ signal: controller.signal, onText: t => seen.push(t) }).catch(() => {})
    expect(seen).toEqual([])
  })
})
