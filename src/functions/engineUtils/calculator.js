/**
 * Minimal math expression evaluator using the shunting-yard algorithm.
 * Supports: + - * / ^ () unary minus, implicit multiplication (e.g. 2(3+1)).
 * Returns a number, or null if the expression is not a valid math query.
 */

const CALC_RE = /^[\d\s+\-*/^().]+$/

const PRECEDENCE = { '+': 1, '-': 1, '*': 2, '/': 2, '^': 3 }
const RIGHT_ASSOC = new Set(['^'])

function tokenize(expr) {
  const tokens = []
  let i = 0
  while (i < expr.length) {
    const ch = expr[i]

    if (/\s/.test(ch)) { i++; continue }

    // Number (integer or decimal)
    if (/[\d.]/.test(ch)) {
      let num = ''
      while (i < expr.length && /[\d.]/.test(expr[i])) num += expr[i++]
      tokens.push({ type: 'num', value: parseFloat(num) })
      continue
    }

    if (ch === '(') { tokens.push({ type: 'lparen' }); i++; continue }
    if (ch === ')') { tokens.push({ type: 'rparen' }); i++; continue }

    if ('+-*/^'.includes(ch)) {
      // Determine if this is a unary minus/plus:
      // unary if it's the first token, or previous token was an operator or '('
      const prev = tokens[tokens.length - 1]
      const isUnary = !prev || prev.type === 'op' || prev.type === 'lparen'

      if (isUnary && ch === '-') {
        tokens.push({ type: 'unary', value: '-' })
      } else if (isUnary && ch === '+') {
        // unary plus is a no-op, skip
      } else {
        tokens.push({ type: 'op', value: ch })
      }
      i++
      continue
    }

    // Unknown character — not a pure math expression
    return null
  }
  return tokens
}

function shuntingYard(tokens) {
  const output = []
  const ops = []

  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i]

    if (tok.type === 'num') {
      // Implicit multiplication: "2(3)" → "2 * (3)"
      const prev = tokens[i - 1]
      if (prev && (prev.type === 'rparen' || prev.type === 'num'))
        ops.push({ type: 'op', value: '*' })
      output.push(tok)
      continue
    }

    if (tok.type === 'unary') {
      ops.push(tok)
      continue
    }

    if (tok.type === 'op') {
      while (ops.length) {
        const top = ops[ops.length - 1]
        if (top.type === 'lparen') break
        if (top.type === 'unary') { output.push(ops.pop()); continue }
        const topPrec = PRECEDENCE[top.value] ?? 0
        const tokPrec = PRECEDENCE[tok.value] ?? 0
        if (topPrec > tokPrec || (topPrec === tokPrec && !RIGHT_ASSOC.has(tok.value)))
          output.push(ops.pop())
        else
          break
      }
      ops.push(tok)
      continue
    }

    if (tok.type === 'lparen') {
      // Implicit multiplication: "(2)(3)" or "3(2)"
      const prev = tokens[i - 1]
      if (prev && (prev.type === 'rparen' || prev.type === 'num'))
        ops.push({ type: 'op', value: '*' })
      ops.push(tok)
      continue
    }

    if (tok.type === 'rparen') {
      while (ops.length && ops[ops.length - 1].type !== 'lparen')
        output.push(ops.pop())
      if (!ops.length) return null // mismatched parens
      ops.pop() // discard lparen
      // flush any unary op sitting above the lparen
      while (ops.length && ops[ops.length - 1].type === 'unary')
        output.push(ops.pop())
      continue
    }
  }

  while (ops.length) {
    const top = ops.pop()
    if (top.type === 'lparen') return null // mismatched parens
    output.push(top)
  }

  return output
}

function evalRPN(rpn) {
  const stack = []
  for (const tok of rpn) {
    if (tok.type === 'num') {
      stack.push(tok.value)
      continue
    }
    if (tok.type === 'unary') {
      if (!stack.length) return null
      stack.push(-stack.pop())
      continue
    }
    if (tok.type === 'op') {
      if (stack.length < 2) return null
      const b = stack.pop(), a = stack.pop()
      switch (tok.value) {
        case '+': stack.push(a + b); break
        case '-': stack.push(a - b); break
        case '*': stack.push(a * b); break
        case '/':
          if (b === 0) return null
          stack.push(a / b)
          break
        case '^': stack.push(Math.pow(a, b)); break
        default: return null
      }
    }
  }
  return stack.length === 1 ? stack[0] : null
}

/**
 * Evaluates a math expression string.
 * @param {string} expr
 * @returns {number|null} Result, or null if not a valid expression.
 */
export function calculate(expr) {
  const clean = expr.trim()
  if (!clean || !CALC_RE.test(clean)) return null

  const tokens = tokenize(clean)
  if (!tokens || tokens.length === 0) return null

  // Must contain at least one operator to be interesting (avoid single numbers)
  const hasOp = tokens.some(t => t.type === 'op' || t.type === 'unary')
  if (!hasOp) return null

  const rpn = shuntingYard(tokens)
  if (!rpn) return null

  const result = evalRPN(rpn)
  if (result === null || !isFinite(result)) return null

  return result
}

/**
 * Formats a calculation result for display.
 * Rounds to 10 significant figures and removes trailing zeros.
 */
export function formatCalcResult(value) {
  if (Number.isInteger(value)) return String(value)
  // Use toPrecision to avoid floating-point noise, then strip trailing zeros
  return parseFloat(value.toPrecision(10)).toString()
}
