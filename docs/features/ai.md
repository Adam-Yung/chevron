# AI answers

> Verified: 2026-11-28 00:04 · Sources: `src/features/ai/AIcompletion.jsx`, `src/features/ai/useCompletion.js`, `src/features/ai/createCompletion.js`, `src/features/ai/providerConfig.js`, `src/features/ai/sse.js`

Double-tap Space in the search field to send the query to an OpenAI-compatible chat endpoint and read the answer, streamed, beside
the field. Nothing is sent otherwise.

## Setup (Settings, Query, AI)
- `query.AI.enabled`: master switch.
- Provider `openai`: needs an API key; base URL and model default to OpenAI's and `gpt-3.5-turbo`.
- Provider `ollama`: needs an explicit base URL (for example `http://localhost:11434`) and a model. No localhost default is assumed.
- Any OpenAI-compatible server (LM Studio, llama.cpp, vLLM) works: choose `openai` and set base URL and model. `/v1` at the end of the
  base URL is optional.
- Optional `temperature` and answer `language`.
- If a required setting is missing the panel says which one and no request is made.

## Behaviour
- "thinking..." shows until the first token; text then renders as Markdown while it arrives.
- Failures show a plain message: the server's own text for an HTTP error (for example a 401 for a wrong key), "Could not reach the AI
  endpoint" for network problems, and an error when a stream ends without any answer. Partial text is kept when a stream fails late.
- A new question cancels the running request first, so answers cannot mix.
- The panel closes with its X button, or Esc while focus is in it, and the page can also close it through the `onClose` prop.
- The last 12 messages are sent as context, so follow-up questions work within a page session.

Tests: `src/features/ai/createCompletion.test.js`, `src/features/ai/sse.test.js`, `src/features/ai/providerConfig.test.js`,
`scripts/e2e/specs/panels.mjs`.
