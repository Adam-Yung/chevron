# src/features/ai/useCompletion.js

One completion per `query`. Returns `{ text, error, waiting }`.

- The effect cleanup aborts the previous request before the next starts and results from an aborted request are dropped, so two answers
  can never interleave.
- Missing config short-circuits to a hint with no request; disabled AI or an empty query clears the state.
- Conversation history (last 12 messages) is only extended when a reply completes, never by aborted or failed turns. It lives in the hook, so it is lost
  when the panel unmounts, which `QueryField` does as soon as the query changes.
- An error after partial text keeps the partial text so the user does not lose what had streamed.

Reviewed: 906cde79
