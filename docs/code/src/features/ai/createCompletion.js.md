# src/features/ai/createCompletion.js

Streaming client for any OpenAI-compatible `/v1/chat/completions` endpoint (OpenAI, Ollama in /v1 mode, LM Studio, llama.cpp, vLLM).

- Resolves with the assistant message; rejects with `{ code, message }` (HTTP status, `network`, `empty` or a server error code) or
  an AbortError. The caller ignores aborts.
- It is an async function end to end. The earlier promise-chain version had no rejection path for a stream that died mid-read, so the
  UI sat on "thinking" forever.
- A payload that is not JSON is skipped (proxy keep-alives). A stream that yields no text at all is an `empty` error rather than a
  blank panel.
- `onText` is not called once the signal aborted, so a superseded stream cannot write into the next answer.
- No Authorization header without a key: local servers do not need one.

`onText` receives the whole answer so far, not the latest piece.
