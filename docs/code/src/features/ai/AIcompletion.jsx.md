# src/features/ai/AIcompletion.jsx

Answer panel next to the search field. Props: `query` (the text to ask; empty clears), `className`, optional `onClose`.

- Renders nothing unless AI is enabled and there is text, an error or a pending request.
- Close control, and Escape while focus is inside the panel, hide it and call `onClose`. Closing mid-stream passes an empty query to
  the hook, which aborts the request. A new query reopens the panel.
- Errors render in a `role="alert"` element, not Markdown: error text may contain backticks that break a code fence.
- Clicks stop propagating so selecting text does not trigger the page's click handlers.
