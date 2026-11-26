# src/features/ai/sse.js

SSE line reader and error-body parser.

The reader buffers incomplete lines between chunks. Parsing each network chunk independently (the old behaviour) lost tokens whenever a
chunk boundary fell inside a JSON payload. `parseErrorBody` understands the OpenAI object shape, Ollama's string shape and plain text,
and always yields a non-empty message.
