# src/lib/renderMarkdown.jsx

Tiny streaming-safe Markdown renderer for AI completions, replacing react-markdown (about 25 KB gzipped).

- Partial output must never break the UI: an unterminated code fence renders as a code block, unterminated inline markers stay literal.
- Safety: only React children (never raw HTML), and link URLs must be http, https, mailto, relative or an anchor, so a hallucinated `javascript:` link is dropped.
- `*` needs a non-space neighbour so `5 * 3` stays literal; `_` additionally must not sit inside a word, so `snake_case_name` is not italicised.
- Supported: headings, fences, lists, bold, italic, inline code, links, hard breaks.
