import { useContext, useEffect, useRef } from 'react'
import { useState } from 'react'
import { SettingsContext } from '../../contexts/Settings'
import renderMarkdown from '../../functions/generationUtils/renderMarkdown'
import Icon from '../../chatGPT/Icon'
import createCompletion from '../../chatGPT/createCompletion'
import classes from './AIcompletion.module.css'

function getAiConfigMessage(language) {
  let config = {
    role: 'system', 
    content: 'You are ChatGPT, a large language model trained by OpenAI. \nKnowledge cutoff: 2021-09'
  }

  // specify current date and time
  config.content += ' \nCurrent date and time: ' + new Date().toLocaleString() + '.'

  // specify language
  if (language)
    config.content += ' \nAnswer in ' + language + ' language.'
 
  return config
}


// Built-in provider presets. Users can also pick "openai" and override
// baseURL freely via the AI > Base URL field for any other OpenAI-compatible
// endpoint (LM Studio, llama.cpp, vLLM, etc.).
const PROVIDER_DEFAULTS = {
  openai: { baseURL: 'https://api.openai.com', model: 'gpt-3.5-turbo', requiresApiKey: true },
  ollama: { baseURL: '', model: '', requiresApiKey: false }
}

function resolveProviderConfig(aiSettings) {
  const provider = aiSettings.provider || 'openai'
  const preset = PROVIDER_DEFAULTS[provider] || PROVIDER_DEFAULTS.openai
  // User overrides win; preset fills in blanks.
  const baseURL = (aiSettings.baseURL || '').trim() || preset.baseURL
  const model = (aiSettings.model || '').trim() || preset.model
  const apiKey = (aiSettings.apiKey || '').trim()

  // Guardrail: refuse to fire any request when required config is missing.
  // For Ollama specifically, the user explicitly opted out of having us
  // auto-target localhost without their config, so both baseURL and model
  // must be filled in by the user themselves.
  let missing = null
  if (provider === 'ollama') {
    if (!aiSettings.baseURL?.trim() || !aiSettings.model?.trim())
      missing = 'Ollama requires both a Base URL (e.g. http://localhost:11434) and a Model (e.g. llama3) to be set in Settings -> Query -> AI before it will run.'
  } else if (preset.requiresApiKey && !apiKey) {
    missing = 'OpenAI requires an API key to be set in Settings -> Query -> AI.'
  } else if (!baseURL || !model) {
    missing = 'AI provider needs both a Base URL and a Model to be set.'
  }

  return {
    provider,
    config: { baseURL, model, apiKey },
    missing
  }
}

function AIcompletion({ query, className }) {
  // settings
  const settings = useContext(SettingsContext)
  const enabled = settings.query.AI.enabled
  const temperature = settings.query.AI.temperature
  const language = settings.query.AI.language

  const aiSettings = settings.query.AI
  const { config: providerConfig, missing } = resolveProviderConfig(aiSettings)

  const [completion, setCompletion] = useState('')
  const chatLogRef = useRef([])

  useEffect(() => {
    if (!enabled)
      return

    let controller = null

    if (query) {
      // No-config guardrail: never fire a request if required provider
      // settings are missing. Show a helpful hint instead.
      if (missing) {
        setCompletion(`## AI not configured\n\n${missing}`)
        return
      }

      const currentQuery = { content: query, role: 'user' }
      const messages = [getAiConfigMessage(language), ...chatLogRef.current, currentQuery ]

      const completionRequest = createCompletion(
        setCompletion,
        messages,
        temperature,
        providerConfig
      )
      completionRequest.promise
      .then(result => chatLogRef.current.push(currentQuery, result))
      .catch(error => setCompletion(`## ⚠️  ${error.code || 'error'} \n \`\`\`${error.message || 'No description available ☹️'}\`\`\``))

      controller = completionRequest.controller
    }
    else
      setCompletion('')

    return () => controller && controller.abort()
    // providerConfig is recomputed each render but only its primitive
    // fields matter for the request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, temperature, providerConfig.baseURL, providerConfig.model, providerConfig.apiKey, enabled, language, missing])

  if (!completion || !enabled)
    return null

  return <>
    <Icon className={classes['icon']} onClick={e => e.stopPropagation()}/>
    <div className={className} onClick={e => e.stopPropagation()}>
      <div className={classes['md-container']}>
        {renderMarkdown(completion)}
      </div>
    </div>
  </>
}

export default AIcompletion