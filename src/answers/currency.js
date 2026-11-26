import currencyCodes from './currencies'
import { AMOUNT_SOURCE, normaliseQuery, parseAmount } from './query'

const RATES_URL = 'https://open.er-api.com/v6/latest/'
const CACHE_TTL_MS = 5 * 60 * 1000
const TIMEOUT_MS = 5000
const SYMBOLS = { $: 'USD', '€': 'EUR', '£': 'GBP', '¥': 'JPY', '₹': 'INR' }

// Informal names and long forms -> ISO 4217 code.
const ALIASES = {
  yen: 'JPY', yuan: 'CNY', renminbi: 'CNY', rmb: 'CNY',
  sterling: 'GBP', pound: 'GBP', pounds: 'GBP', quid: 'GBP',
  buck: 'USD', bucks: 'USD', dollar: 'USD', dollars: 'USD',
  euro: 'EUR', euros: 'EUR',
  ruble: 'RUB', rouble: 'RUB',
  rupee: 'INR', rupees: 'INR',
  franc: 'CHF', francs: 'CHF',
  krona: 'SEK', kronor: 'SEK', krone: 'NOK', kroner: 'NOK',
  won: 'KRW', baht: 'THB', lira: 'TRY', peso: 'MXN',
  real: 'BRL', reais: 'BRL', dinar: 'KWD', dirham: 'AED',
  bitcoin: 'BTC', ethereum: 'ETH',
}

const SPLIT_RE = /^(.+?) (?:in|to|into|as) (\S+)$/
const FROM_RE = new RegExp(`^(?:([$€£¥₹]) ?)?(?:(${AMOUNT_SOURCE}) ?)?([a-z]{3,})?$`)

/** Rates by base currency: { rates, fetchedAt }. One fetch serves every target and amount. */
const rateCache = new Map()

/** Test hook: forgets cached rates. */
export function clearCurrencyCache() {
  rateCache.clear()
}

function resolveCode(raw) {
  const word = raw.toLowerCase()
  const code = Object.hasOwn(ALIASES, word) ? ALIASES[word] : word.toUpperCase()
  return currencyCodes.includes(code) ? code : null
}

function resolveSymbolOrCode(raw) {
  return Object.hasOwn(SYMBOLS, raw) ? SYMBOLS[raw] : resolveCode(raw)
}

function parseCurrency(query) {
  const split = SPLIT_RE.exec(normaliseQuery(query))
  const left = split && FROM_RE.exec(split[1])
  if (!left || (left[1] && left[3]) || (!left[1] && !left[3])) return null
  const from = left[1] ? SYMBOLS[left[1]] : resolveCode(left[3])
  const to = resolveSymbolOrCode(split[2])
  if (!from || !to || from === to) return null
  return { from, to, amount: left[2] ? parseAmount(left[2]) : 1 }
}

/**
 * Cheap synchronous gate: true only when the query names two known currencies, so callers
 * can skip scheduling a network request for ordinary searches.
 */
export function looksLikeCurrency(query) {
  return parseCurrency(query) !== null
}

// Two decimals for ordinary amounts; sub-unit amounts (1 yen in usd) keep 3 significant digits.
function formatMoney(value) {
  if (Math.abs(value) >= 1) return value.toFixed(2)
  const rounded = Number(value.toPrecision(3))
  if (Math.abs(rounded) < 1e-6) return String(rounded)
  const decimals = (String(rounded).split('.')[1] ?? '').length
  return rounded.toFixed(Math.max(2, decimals))
}

function toAnswer({ from, to, amount }, rate) {
  if (!Number.isFinite(rate)) return null
  return {
    suggestion: `${formatMoney(rate * amount)} ${to}`,
    type: 'currency',
    relevance: 5000,
    label: `1 ${from} = ${Number(rate.toPrecision(5))} ${to}`,
  }
}

async function loadRates(from, signal, fetchImpl) {
  const cached = rateCache.get(from)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) return cached.rates

  signal?.throwIfAborted()
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => { timedOut = true; controller.abort() }, TIMEOUT_MS)
  const onAbort = () => controller.abort()
  signal?.addEventListener('abort', onAbort, { once: true })
  try {
    const response = await fetchImpl(RATES_URL + from, { signal: controller.signal })
    const data = await response.json()
    if (data?.result !== 'success' || !data.rates) return null
    rateCache.set(from, { rates: data.rates, fetchedAt: Date.now() })
    return data.rates
  } catch (err) {
    // A caller abort must propagate so stale lookups are dropped; our own timeout is just "no answer".
    if (err?.name === 'AbortError' && !timedOut) throw err
    return null
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onAbort)
  }
}

/**
 * Live currency conversion (`100 usd to eur`, `$5 in yen`, `euro to bucks`).
 * Resolves to null for non-currency queries, network failures and unknown targets;
 * rejects only with AbortError when the caller's signal aborts.
 * @param {string} query
 * @param {{ signal?: AbortSignal, fetchImpl?: typeof fetch }} [options]
 * @returns {Promise<import('./index').Answer|null>}
 */
export async function currencyAnswer(query, { signal, fetchImpl = fetch } = {}) {
  const parsed = parseCurrency(query)
  if (!parsed) return null
  const rates = await loadRates(parsed.from, signal, fetchImpl)
  return rates ? toAnswer(parsed, rates[parsed.to]) : null
}
