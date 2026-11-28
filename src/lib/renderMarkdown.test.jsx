import { describe, it, expect } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import renderMarkdown from './renderMarkdown'

const html = src => renderToStaticMarkup(<div>{renderMarkdown(src)}</div>)

describe('renderMarkdown: blocks', () => {
  it.each([
    ['', ''], [null, ''], [undefined, ''],
    ['hello', '<p>hello</p>'], ['# Title', '<h1>Title</h1>'], ['###### Six', '<h6>Six</h6>'], ['####### Seven', '<p>####### Seven</p>'],
    ['- a\n- b', '<ul><li>a</li><li>b</li></ul>'], ['* a\n* b', '<ul><li>a</li><li>b</li></ul>'], ['1. a\n2. b', '<ol><li>a</li><li>b</li></ol>'],
    ['one\n\ntwo', '<p>one</p><p>two</p>'], ['one\ntwo', '<p>one two</p>'], ['one  \ntwo', '<p>one<br/>two</p>'],
    ['- a\n\ntext', '<ul><li>a</li></ul><p>text</p>'], ['- a\n1. b', '<ul><li>a</li></ul><ol><li>b</li></ol>'],
    ['text\n- a', '<p>text</p><ul><li>a</li></ul>'], ['# H\ntext', '<h1>H</h1><p>text</p>'],
  ])('%j', (src, expected) => {
    expect(html(src)).toBe(`<div>${expected}</div>`)
  })
})

describe('renderMarkdown: inline', () => {
  it.each([
    ['**bold**', '<p><strong>bold</strong></p>'], ['*it*', '<p><em>it</em></p>'], ['_it_', '<p><em>it</em></p>'], ['`code`', '<p><code>code</code></p>'],
    ['a **b** c', '<p>a <strong>b</strong> c</p>'], ['5 * 3 * 2', '<p>5 * 3 * 2</p>'], ['**a *b* c**', '<p><strong>a <em>b</em> c</strong></p>'],
    ['`**not bold**`', '<p><code>**not bold**</code></p>'], ['snake_case_name', '<p>snake_case_name</p>'], ['use my_var and other_var', '<p>use my_var and other_var</p>'], ['an _it_ word', '<p>an <em>it</em> word</p>'], ['(_it_)', '<p>(<em>it</em>)</p>'],
    ['[a](https://x.com)', '<p><a href="https://x.com" target="_blank" rel="noopener noreferrer">a</a></p>'],
    ['[a](mailto:x@y.z)', '<p><a href="mailto:x@y.z" target="_blank" rel="noopener noreferrer">a</a></p>'],
  ])('%j', (src, expected) => {
    expect(html(src)).toBe(`<div>${expected}</div>`)
  })
})

describe('renderMarkdown: streaming safety (partial AI output never breaks)', () => {
  it('renders an unterminated code fence as a code block', () => {
    expect(html('```js\nconst a = 1')).toBe('<div><pre><code data-lang="js">const a = 1</code></pre></div>')
    expect(html('```')).toBe('<div><pre><code></code></pre></div>')
  })

  it('renders a closed fence and continues after it', () => {
    expect(html('```\nx\n```\nafter')).toBe('<div><pre><code>x</code></pre><p>after</p></div>')
  })

  it('leaves unterminated inline markers as literal text', () => {
    expect(html('**half')).toBe('<div><p>**half</p></div>')
    expect(html('`half')).toBe('<div><p>`half</p></div>')
    expect(html('*half')).toBe('<div><p>*half</p></div>')
    expect(html('[label](https://x')).toBe('<div><p>[label](https://x</p></div>')
    expect(html('[label](')).toBe('<div><p>[label](</p></div>')
    expect(html('[label')).toBe('<div><p>[label</p></div>')
  })

  it('never throws at any prefix of a rich document', () => {
    const doc = '# Title\n\nSome **bold** and *it* with `code` and [link](https://x.com).\n\n- one\n- two\n\n1. a\n2. b\n\n```js\nlet a = "<b>"\n```\n\nEnd  \nline'
    for (let i = 0; i <= doc.length; i++) expect(() => html(doc.slice(0, i))).not.toThrow()
  })

  it('every prefix renders valid, balanced HTML', () => {
    const doc = '# T\n\nA **b** `c` [d](https://x.com)\n\n- one\n\n```\ncode\n```'
    for (let i = 1; i <= doc.length; i++) {
      const out = html(doc.slice(0, i))
      for (const tag of ['strong', 'em', 'code', 'a', 'ul', 'li', 'pre', 'p', 'h1']) {
        expect(out.split(`<${tag}`).length - 1 >= out.split(`</${tag}>`).length - 1).toBe(true)
      }
    }
  })
})

describe('renderMarkdown: safety', () => {
  it('escapes HTML instead of injecting it', () => {
    const out = html('<script>alert(1)</script> <img src=x onerror=alert(1)>')
    expect(out).not.toContain('<script')
    expect(out).not.toContain('<img')
    expect(out).toContain('&lt;script&gt;')
  })

  it.each(['javascript:alert(1)', 'data:text/html,x', 'vbscript:x', 'JaVaScRiPt:alert(1)', ' javascript:alert(1)'])('drops %s links', url => {
    const out = html(`[click](${url})`)
    expect(out).not.toContain('<a')
    expect(out).not.toContain('href')
  })

  it.each(['/relative', '#anchor', 'http://x.com', 'HTTPS://X.COM'])('keeps safe link %s', url => {
    expect(html(`[a](${url})`)).toContain(`href="${url}"`)
  })

  it('escapes HTML inside code blocks and inline code', () => {
    expect(html('```\n<b>x</b>\n```')).toContain('&lt;b&gt;x&lt;/b&gt;')
    expect(html('`<b>`')).toContain('<code>&lt;b&gt;</code>')
  })

  it('never uses dangerouslySetInnerHTML (no raw markup survives from a heading)', () => {
    expect(html('# <u>x</u>')).toBe('<div><h1>&lt;u&gt;x&lt;/u&gt;</h1></div>')
  })
})

const keysOf = node => {
  if (Array.isArray(node)) return node.flatMap(keysOf)
  if (!node?.props) return []
  return [node.key, ...keysOf(node.props.children)]
}

describe('renderMarkdown: element keys', () => {
  it('keys inline elements by block and position, so streaming updates reuse them', () => {
    expect(keysOf(renderMarkdown('a **b** `c` [d](https://x.com) _e_'))).toEqual(['b0', 'l0', 'b0l0:1', 'b0l0:2', 'b0l0:4', 'b0l0:6'])
  })
})
