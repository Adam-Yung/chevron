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

// Walk the string, splitting it on the inline tokens. Returns an array
// of React children. We process tokens in priority order: code (which
// suppresses other markup), then bold, italic, link.
function renderInline(text, keyPrefix) {
  if (!text) return null
  const out = []
  let i = 0
  let buf = ''
  let key = 0
  const flushBuf = () => {
    if (buf) {
      out.push(buf)
      buf = ''
    }
  }
  const childKey = () => keyPrefix + ':' + (key++)
  while (i < text.length) {
    const ch = text[i]

    // inline code: `…`
    if (ch === '`') {
      const end = text.indexOf('`', i + 1)
      if (end !== -1) {
        flushBuf()
        out.push(<code key={childKey()}>{text.slice(i + 1, end)}</code>)
        i = end + 1
        continue
      }
    }

    // bold: **…**  (must come before single-* italic check)
    if (ch === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2)
      if (end !== -1) {
        flushBuf()
        out.push(<strong key={childKey()}>{renderInline(text.slice(i + 2, end), childKey())}</strong>)
        i = end + 2
        continue
      }
    }

    // italic: *…* or _…_
    if (ch === '*' || ch === '_') {
      // require a non-space immediately after the opener so we don't
      // turn `5 * 3` into italics.
      if (text[i + 1] && text[i + 1] !== ' ' && text[i + 1] !== ch) {
        const end = text.indexOf(ch, i + 1)
        if (end !== -1 && text[end - 1] !== ' ') {
          flushBuf()
          out.push(<em key={childKey()}>{renderInline(text.slice(i + 1, end), childKey())}</em>)
          i = end + 1
          continue
        }
      }
    }

    // link: [label](url)
    if (ch === '[') {
      const labelEnd = text.indexOf(']', i + 1)
      if (labelEnd !== -1 && text[labelEnd + 1] === '(') {
        const urlEnd = text.indexOf(')', labelEnd + 2)
        if (urlEnd !== -1) {
          const label = text.slice(i + 1, labelEnd)
          const url = text.slice(labelEnd + 2, urlEnd).trim()
          if (SAFE_URL.test(url)) {
            flushBuf()
            out.push(
              <a key={childKey()} href={url} target="_blank" rel="noopener noreferrer">
                {renderInline(label, childKey())}
              </a>
            )
            i = urlEnd + 1
            continue
          }
        }
      }
    }

    buf += ch
    i++
  }
  flushBuf()
  return out.length === 1 ? out[0] : out
}

function blockKey(idx) { return 'b' + idx }

// Block-level pass: split the input on blank lines and fenced code,
// then render each block.
export default function renderMarkdown(src) {
  if (!src) return null
  const lines = String(src).split('\n')
  const blocks = []
  let i = 0

  // Helpers for accumulating list items so consecutive bullets stay in
  // the same <ul>/<ol>.
  let listType = null     // 'ul' | 'ol' | null
  let listItems = []
  const flushList = () => {
    if (!listType) return
    const Tag = listType
    const idx = blocks.length
    blocks.push(
      <Tag key={blockKey(idx)}>
        {listItems.map((item, k) => (
          <li key={k}>{renderInline(item, blockKey(idx) + 'i' + k)}</li>
        ))}
      </Tag>
    )
    listType = null
    listItems = []
  }

  while (i < lines.length) {
    const line = lines[i]

    // fenced code block (handles unterminated fences for streaming output)
    if (line.startsWith('```')) {
      flushList()
      const lang = line.slice(3).trim()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      const closed = i < lines.length
      const idx = blocks.length
      blocks.push(
        <pre key={blockKey(idx)}>
          <code data-lang={lang || undefined}>{codeLines.join('\n')}</code>
        </pre>
      )
      if (closed) i++ // consume the closing ```
      continue
    }

    // ATX heading
    const headingMatch = /^(#{1,6})\s+(.*)$/.exec(line)
    if (headingMatch) {
      flushList()
      const level = headingMatch[1].length
      const Tag = 'h' + level
      const idx = blocks.length
      blocks.push(
        <Tag key={blockKey(idx)}>{renderInline(headingMatch[2], blockKey(idx))}</Tag>
      )
      i++
      continue
    }

    // unordered list item
    const ulMatch = /^[-*]\s+(.*)$/.exec(line)
    if (ulMatch) {
      if (listType !== 'ul') flushList()
      listType = 'ul'
      listItems.push(ulMatch[1])
      i++
      continue
    }

    // ordered list item
    const olMatch = /^\d+\.\s+(.*)$/.exec(line)
    if (olMatch) {
      if (listType !== 'ol') flushList()
      listType = 'ol'
      listItems.push(olMatch[1])
      i++
      continue
    }

    // blank line: paragraph break (and list break)
    if (line.trim() === '') {
      flushList()
      i++
      continue
    }

    // paragraph: gather consecutive non-special lines
    flushList()
    const paraLines = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() !== '' &&
      !lines[i].startsWith('```') &&
      !/^(#{1,6})\s+/.test(lines[i]) &&
      !/^[-*]\s+/.test(lines[i]) &&
      !/^\d+\.\s+/.test(lines[i])
    ) {
      paraLines.push(lines[i])
      i++
    }
    const idx = blocks.length
    // hard breaks: line ending in two+ spaces becomes <br/>
    const paraChildren = []
    paraLines.forEach((pl, k) => {
      const hardBreak = /\s{2,}$/.test(pl)
      paraChildren.push(
        <Fragment key={'l' + k}>
          {renderInline(pl.replace(/\s+$/, ''), blockKey(idx) + 'l' + k)}
          {hardBreak && k < paraLines.length - 1 ? <br /> : k < paraLines.length - 1 ? ' ' : null}
        </Fragment>
      )
    })
    blocks.push(<p key={blockKey(idx)}>{paraChildren}</p>)
  }
  flushList()

  return blocks
}
