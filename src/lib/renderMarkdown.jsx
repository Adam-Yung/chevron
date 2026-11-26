/* Tiny streaming-friendly Markdown renderer.
 *
 * Why: this app shows Markdown in exactly one place (AI completions).
 * Pulling in `react-markdown` + `mdast-util-from-markdown` + `unified`
 * costs ~25 KB gzipped — overkill for the small subset we actually need.
 *
 * Supported syntax (intentionally tiny):
 *   - ATX headings: `#` … `######`
 *   - Fenced code blocks: ```lang \n code \n ```
 *   - Unordered lists: lines starting with `- ` or `* `
 *   - Ordered lists: lines starting with `<digit>. `
 *   - Inline code:    `code`
 *   - Bold:           **text**
 *   - Italic:         *text*  /  _text_
 *   - Links:          [label](https://…)  (only http/https/mailto allowed)
 *   - Hard line break (two trailing spaces) and blank-line paragraphs.
 *
 * Streaming: an unterminated fenced code block is still rendered as
 * `<pre><code>` with whatever content has arrived so far, so a partial
 * AI response doesn't blow up the UI.
 *
 * Safety: HTML in the input is escaped (we only use `children` props,
 * never `dangerouslySetInnerHTML`). Link URLs are filtered through an
 * allow-list of safe schemes so a hallucinated `javascript:` URL can't
 * be clicked into existence.
 */

import { Fragment } from 'react'

const SAFE_URL = /^(https?:|mailto:|\/|#)/i

const WORD_CHAR = /[A-Za-z0-9]/

// Index of the closing marker for an emphasis opened at `start`, or -1. A marker needs a
// non-space neighbour inside (so `5 * 3` stays literal) and `_` must not sit inside a word,
// otherwise identifiers such as snake_case_name turn into italics in AI answers.
function findItalicEnd(text, start, ch) {
  const next = text[start + 1]
  if (!next || next === ' ' || next === ch) return -1
  if (ch === '_' && WORD_CHAR.test(text[start - 1] ?? '')) return -1
  const end = text.indexOf(ch, start + 1)
  if (end === -1 || text[end - 1] === ' ') return -1
  if (ch === '_' && WORD_CHAR.test(text[end + 1] ?? '')) return -1
  return end
}

// Inline readers, tried in order at each position. Each returns { node, end } when its token starts at `i`, else null. Code comes
// first because it suppresses all other markup inside it.
const INLINE_READERS = [
  function code(text, i, key) {
    if (text[i] !== '`') return null
    const end = text.indexOf('`', i + 1)
    return end === -1 ? null : { node: <code key={key()}>{text.slice(i + 1, end)}</code>, end: end + 1 }
  },
  function bold(text, i, key) {
    if (!text.startsWith('**', i)) return null
    const end = text.indexOf('**', i + 2)
    return end === -1 ? null : { node: <strong key={key()}>{renderInline(text.slice(i + 2, end), key())}</strong>, end: end + 2 }
  },
  function italic(text, i, key) {
    const ch = text[i]
    if (ch !== '*' && ch !== '_') return null
    const end = findItalicEnd(text, i, ch)
    return end === -1 ? null : { node: <em key={key()}>{renderInline(text.slice(i + 1, end), key())}</em>, end: end + 1 }
  },
  function link(text, i, key) {
    if (text[i] !== '[') return null
    const labelEnd = text.indexOf(']', i + 1)
    if (labelEnd === -1 || text[labelEnd + 1] !== '(') return null
    const urlEnd = text.indexOf(')', labelEnd + 2)
    const url = urlEnd === -1 ? '' : text.slice(labelEnd + 2, urlEnd).trim()
    if (!SAFE_URL.test(url)) return null
    const node = (
      <a key={key()} href={url} target="_blank" rel="noopener noreferrer">{renderInline(text.slice(i + 1, labelEnd), key())}</a>
    )
    return { node, end: urlEnd + 1 }
  }
]

function readInline(text, i, key) {
  for (const read of INLINE_READERS) {
    const token = read(text, i, key)
    if (token) return token
  }
  return null
}

function renderInline(text, keyPrefix) {
  if (!text) return null
  const out = []
  let buf = ''
  let n = 0
  const key = () => keyPrefix + ':' + (n++)
  for (let i = 0; i < text.length;) {
    const token = readInline(text, i, key)
    if (!token) {
      buf += text[i++]
      continue
    }
    if (buf) out.push(buf)
    buf = ''
    out.push(token.node)
    i = token.end
  }
  if (buf) out.push(buf)
  return out.length === 1 ? out[0] : out
}

const blockKey = idx => 'b' + idx
const HEADING = /^(#{1,6})\s+(.*)$/
const UL_ITEM = /^[-*]\s+(.*)$/
const OL_ITEM = /^\d+\.\s+(.*)$/
const startsBlock = line => line.trim() === '' || line.startsWith('```') || HEADING.test(line) || UL_ITEM.test(line) || OL_ITEM.test(line)

// An unterminated fence still renders what has arrived: streamed AI output is often mid-block.
function readFence(lines, i, idx) {
  const lang = lines[i].slice(3).trim()
  let end = i + 1
  while (end < lines.length && !lines[end].startsWith('```')) end++
  const node = <pre key={blockKey(idx)}><code data-lang={lang || undefined}>{lines.slice(i + 1, end).join('\n')}</code></pre>
  return { node, next: Math.min(end + 1, lines.length) }
}

function readHeading(lines, i, idx) {
  const m = HEADING.exec(lines[i])
  const Tag = 'h' + m[1].length
  return { node: <Tag key={blockKey(idx)}>{renderInline(m[2], blockKey(idx))}</Tag>, next: i + 1 }
}

function readList(lines, i, idx) {
  const pattern = UL_ITEM.test(lines[i]) ? UL_ITEM : OL_ITEM
  const Tag = pattern === UL_ITEM ? 'ul' : 'ol'
  const items = []
  let next = i
  for (let m = pattern.exec(lines[next]); m; m = pattern.exec(lines[next] ?? '')) {
    items.push(m[1])
    next++
  }
  const node = <Tag key={blockKey(idx)}>{items.map((item, k) => <li key={k}>{renderInline(item, blockKey(idx) + 'i' + k)}</li>)}</Tag>
  return { node, next }
}

// Consecutive plain lines form one paragraph; a line ending in two spaces is a hard break.
function readParagraph(lines, i, idx) {
  let next = i + 1
  while (next < lines.length && !startsBlock(lines[next])) next++
  const para = lines.slice(i, next)
  const children = para.map((line, k) => {
    const last = k === para.length - 1
    const separator = /\s{2,}$/.test(line) ? <br /> : ' '
    return <Fragment key={'l' + k}>{renderInline(line.replace(/\s+$/, ''), blockKey(idx) + 'l' + k)}{last ? null : separator}</Fragment>
  })
  return { node: <p key={blockKey(idx)}>{children}</p>, next }
}

function readBlock(lines, i, idx) {
  const line = lines[i]
  if (line.startsWith('```')) return readFence(lines, i, idx)
  if (HEADING.test(line)) return readHeading(lines, i, idx)
  if (UL_ITEM.test(line) || OL_ITEM.test(line)) return readList(lines, i, idx)
  return readParagraph(lines, i, idx)
}

export default function renderMarkdown(src) {
  if (!src) return null
  const lines = String(src).split('\n')
  const blocks = []
  for (let i = 0; i < lines.length;) {
    if (lines[i].trim() === '') {
      i++
      continue
    }
    const { node, next } = readBlock(lines, i, blocks.length)
    blocks.push(node)
    i = next
  }
  return blocks
}
