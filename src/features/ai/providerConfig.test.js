import { describe, expect, it } from 'vitest'
import { resolveProviderConfig, systemMessage } from './providerConfig'

describe('resolveProviderConfig', () => {
  it('asks for a key before using the OpenAI default', () => {
    expect(resolveProviderConfig({ provider: 'openai' }).missing).toMatch(/API key/)
    expect(resolveProviderConfig({ provider: 'openai', apiKey: 'sk' }).missing).toBeNull()
  })

  it('requires an explicit URL and model for Ollama', () => {
    expect(resolveProviderConfig({ provider: 'ollama' }).missing).toMatch(/Ollama/)
    expect(resolveProviderConfig({ provider: 'ollama', baseURL: 'http://h:1', model: 'm' }).missing).toBeNull()
  })

  it('lets user fields override the preset', () => {
    const { config } = resolveProviderConfig({ provider: 'openai', apiKey: 'k', baseURL: ' http://lm:1234 ', model: 'x' })
    expect(config).toEqual({ baseURL: 'http://lm:1234', model: 'x', apiKey: 'k' })
  })
})

describe('systemMessage', () => {
  it('adds the language only when requested', () => {
    expect(systemMessage('').content).not.toMatch(/Answer in/)
    expect(systemMessage('French').content).toMatch(/Answer in French language/)
  })
})
