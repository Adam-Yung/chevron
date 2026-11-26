import { describe, expect, it } from 'vitest'
import { createSseReader, parseErrorBody } from './sse'

describe('createSseReader', () => {
  it('reassembles a payload split across chunks', () => {
    const seen = []
    const reader = createSseReader(d => seen.push(d))
    reader.push('data: {"a":')
    reader.push('1}\n\ndata: [DONE]\n')
    reader.end()
    expect(seen).toEqual(['{"a":1}', '[DONE]'])
  })

  it('flushes a final line that has no newline', () => {
    const seen = []
    const reader = createSseReader(d => seen.push(d))
    reader.push('data: last')
    reader.end()
    expect(seen).toEqual(['last'])
  })

  it('ignores comments and other fields', () => {
    const seen = []
    const reader = createSseReader(d => seen.push(d))
    reader.push(': keep-alive\nevent: x\n')
    expect(seen).toEqual([])
  })
})

describe('parseErrorBody', () => {
  it('reads the OpenAI shape', () => {
    expect(parseErrorBody('{"error":{"code":"invalid_api_key","message":"Bad key"}}', 401)).toEqual({ code: 'invalid_api_key', message: 'Bad key' })
  })

  it('reads the Ollama string shape and plain text', () => {
    expect(parseErrorBody('{"error":"model not found"}', 404).message).toBe('model not found')
    expect(parseErrorBody('upstream down', 502)).toEqual({ code: 502, message: 'upstream down' })
  })

  it('never returns an empty message', () => {
    expect(parseErrorBody('', 500).message).toMatch(/500/)
  })
})
