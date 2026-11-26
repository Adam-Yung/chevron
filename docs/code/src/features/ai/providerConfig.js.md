# src/features/ai/providerConfig.js

Turns AI settings into a request config and a `missing` hint.

OpenAI needs a key; Ollama needs an explicit base URL and model (no silent localhost default, the user opts in). When something is
missing the UI shows the hint and sends no request: the app never fires a half-configured call. The system prompt no longer claims to be
ChatGPT, which was wrong for every other provider.
