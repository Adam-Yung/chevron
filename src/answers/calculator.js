import { formatNumber } from './format'
import { normaliseQuery } from './query'

const MAX_DEPTH = 40
// Unspaced digit chains are dates, phone numbers, ISBNs, years, fractions: not sums.
const DATE_OR_ID_LIKE = /^\d+(?:-\d+){2,}$|^\d{4,}-\d+$|^\d+-\d{4,}$|^\d+(?:\/\d+)+$/
// 0xff, 0b101, 0o7 belong to the base converter and would otherwise parse as `0 x ff`.
const BASE_PREFIX = /\b0[xbo][0-9a-f]/

const FUNCTIONS = {
  sqrt: Math.sqrt, cbrt: Math.cbrt, abs: Math.abs, round: Math.round, floor: Math.floor, ceil: Math.ceil,
  sin: Math.sin, cos: Math.cos, tan: Math.tan, asin: Math.asin, acos: Math.acos, atan: Math.atan,
  log: Math.log10, ln: Math.log, exp: Math.exp,
}
const CONSTANTS = { pi: Math.PI, e: Math.E }
const SYMBOL_OPS = { '+': '+', '-': '-', '−': '-', '*': '*', '×': '*', '/': '/', '÷': '/', '^': '^' }
// Trig results this small are float residue of an exact zero (sin(pi)).
const TRIG_ZERO = 1e-15
const TRIG = new Set(['sin', 'cos', 'tan'])

class CalcError extends Error {}

function fail() { throw new CalcError() }

function finite(value) {
  if (!Number.isFinite(value)) fail()
  return value
}

// ── tokenizer ────────────────────────────────────────────────────────────────

const NUMBER_RE = /^(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?/
const WORD_RE = /^[a-z]+/

function readSymbol(text) {
  if (text.startsWith('**')) return { token: { t: 'op', v: '^' }, length: 2 }
  const ch = text[0]
  if (Object.hasOwn(SYMBOL_OPS, ch)) return { token: { t: 'op', v: SYMBOL_OPS[ch] }, length: 1 }
  if (ch === '(' || ch === ')') return { token: { t: ch }, length: 1 }
  if (ch === '!' || ch === '%') return { token: { t: 'post', v: ch }, length: 1 }
  return null
}

function readWord(text) {
  const word = WORD_RE.exec(text)?.[0]
  if (!word) return null
  // A lone x is multiplication; every other word must be a known function or constant.
  if (word === 'x') return { token: { t: 'op', v: '*' }, length: 1 }
  return { token: { t: 'id', v: word }, length: word.length }
}

function readToken(text) {
  const num = NUMBER_RE.exec(text)
  if (num) return { token: { t: 'num', v: Number(num[0]) }, length: num[0].length }
  return readSymbol(text) ?? readWord(text)
}

function tokenize(source) {
  const tokens = []
  let rest = source.trim()
  while (rest) {
    const read = readToken(rest)
    if (!read) fail()
    tokens.push(read.token)
    rest = rest.slice(read.length).trimStart()
  }
  return tokens
}

// ── recursive-descent parser ─────────────────────────────────────────────────
// Values are { v, pct }: pct marks a bare `n%` so `80 + 15%` can mean 80 * 1.15.

class Parser {
  constructor(tokens) {
    this.tokens = tokens
    this.pos = 0
    this.depth = 0
    this.meaningful = false
  }

  peek() { return this.tokens[this.pos] }

  take() { return this.tokens[this.pos++] }

  isOp(...ops) {
    const tok = this.peek()
    return tok?.t === 'op' && ops.includes(tok.v)
  }

  descend(parse) {
    if (++this.depth > MAX_DEPTH) fail()
    const result = parse()
    this.depth--
    return result
  }

  expr() {
    let left = this.term()
    while (this.isOp('+', '-')) {
      const op = this.take().v
      const right = this.term()
      this.meaningful = true
      const amount = right.pct ? left.v * right.v : right.v
      left = { v: finite(op === '+' ? left.v + amount : left.v - amount) }
    }
    return left
  }

  term() {
    let left = this.unary()
    for (;;) {
      const tok = this.peek()
      if (this.isOp('*', '/')) {
        const op = this.take().v
        this.meaningful = true
        left = this.multiply(left, op, this.unary())
      } else if (tok?.t === '(' || tok?.t === 'id') {
        // Implicit product: 2(3+1), (1+2)(3), 2pi. Only a parenthesis counts as clearly math.
        this.meaningful = this.meaningful || tok.t === '('
        left = this.multiply(left, '*', this.unary())
      } else return left
    }
  }

  multiply(left, op, right) {
    if (op === '/' && right.v === 0) fail()
    return { v: finite(op === '*' ? left.v * right.v : left.v / right.v) }
  }

  unary() {
    if (this.isOp('-')) {
      this.take()
      const inner = this.descend(() => this.unary())
      return { v: -inner.v, pct: inner.pct }
    }
    if (this.isOp('+')) {
      this.take()
      return this.descend(() => this.unary())
    }
    return this.power()
  }

  // Exponent is parsed with unary() so 2^-3 works and ^ stays right-associative.
  power() {
    const base = this.postfix()
    if (!this.isOp('^')) return base
    this.take()
    this.meaningful = true
    const exponent = this.descend(() => this.unary())
    return { v: finite(Math.pow(base.v, exponent.v)) }
  }

  postfix() {
    let value = this.primary()
    while (this.peek()?.t === 'post') {
      value = this.take().v === '!' ? this.factorial(value) : { v: value.v / 100, pct: true }
    }
    return value
  }

  factorial(value) {
    if (!Number.isInteger(value.v) || value.v < 0 || value.v > 170) fail()
    this.meaningful = true
    let result = 1
    for (let i = 2; i <= value.v; i++) result *= i
    return { v: result }
  }

  primary() {
    const tok = this.take()
    if (!tok) fail()
    if (tok.t === 'num') return { v: tok.v }
    if (tok.t === '(') return this.parenthesised()
    if (tok.t === 'id') return this.identifier(tok.v)
    return fail()
  }

  parenthesised() {
    const inner = this.descend(() => this.expr())
    if (this.take()?.t !== ')') fail()
    return { v: inner.v }
  }

  identifier(name) {
    if (Object.hasOwn(CONSTANTS, name)) return { v: CONSTANTS[name] }
    if (!Object.hasOwn(FUNCTIONS, name) || this.take()?.t !== '(') return fail()
    this.meaningful = true
    const arg = this.descend(() => this.expr())
    if (this.take()?.t !== ')') fail()
    const result = finite(FUNCTIONS[name](arg.v))
    return { v: TRIG.has(name) && Math.abs(result) < TRIG_ZERO ? 0 : result }
  }
}

/** Evaluates math without eval or Function; null unless the text is clearly math with a finite result. */
export function calculate(expr) {
  const text = String(expr).trim().toLowerCase()
  if (!text || DATE_OR_ID_LIKE.test(text) || BASE_PREFIX.test(text)) return null
  try {
    const parser = new Parser(tokenize(text))
    const { v } = parser.expr()
    if (parser.pos !== parser.tokens.length || !parser.meaningful) return null
    return Number.isFinite(v) ? v : null
  } catch (err) {
    // Deep nesting can overflow the stack; every other failure is a CalcError.
    if (err instanceof CalcError || err instanceof RangeError) return null
    throw err
  }
}

/** Formats a result to 10 significant digits with float noise removed. */
export function formatCalcResult(value) {
  return formatNumber(value, 10)
}

/** @returns {import('./index').Answer|null} */
export function calculatorAnswer(query) {
  const q = normaliseQuery(query)
  const value = q ? calculate(q) : null
  if (value === null) return null
  return { suggestion: formatCalcResult(value), type: 'calculator', relevance: 5000, label: q }
}
