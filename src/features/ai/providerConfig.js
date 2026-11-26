// Presets only fill blanks; any field the user sets wins, so "openai" with a custom baseURL covers LM Studio, llama.cpp, vLLM.
const PRESETS = {
  openai: { baseURL: 'https://api.openai.com', model: 'gpt-3.5-turbo', requiresApiKey: true },
  ollama: { baseURL: '', model: '', requiresApiKey: false }
}

const OLLAMA_HINT = 'Ollama requires both a Base URL (e.g. http://localhost:11434) and a Model (e.g. llama3) to be set in Settings -> Query -> AI before it will run.'

function missingSetting(provider, preset, { baseURL, model, apiKey }, raw) {
  // Ollama gets no localhost default on purpose: the user must opt in to talking to a local server.
  if (provider === 'ollama') return raw.baseURL?.trim() && raw.model?.trim() ? null : OLLAMA_HINT
  if (preset.requiresApiKey && !apiKey) return 'OpenAI requires an API key to be set in Settings -> Query -> AI.'
  if (!baseURL || !model) return 'AI provider needs both a Base URL and a Model to be set.'
  return null
}

/** Merge user settings over the provider preset; `missing` is a hint to show instead of firing a request. */
export function resolveProviderConfig(ai) {
  const provider = ai.provider || 'openai'
  const preset = PRESETS[provider] || PRESETS.openai
  const config = {
    baseURL: (ai.baseURL || '').trim() || preset.baseURL,
    model: (ai.model || '').trim() || preset.model,
    apiKey: (ai.apiKey || '').trim()
  }
  return { provider, config, missing: missingSetting(provider, preset, config, ai) }
}

/** System prompt; the date is included because models otherwise guess it, and the language only when the user asked for one. */
export function systemMessage(language) {
  let content = 'You are a helpful assistant answering a quick question from a browser start page. Keep answers concise.'
  content += ' \nCurrent date and time: ' + new Date().toLocaleString() + '.'
  if (language) content += ' \nAnswer in ' + language + ' language.'
  return { role: 'system', content }
}
