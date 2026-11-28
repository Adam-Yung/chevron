// HTTP GET for the icon sources. Certificate checks are off here: docs/code/scripts/icons/fetch.mjs.md.
import https from 'https'
import http from 'http'

const TIMEOUT_MS = 10000

const tlsAgent = new https.Agent({ rejectUnauthorized: false })

export function fetchBuffer(url, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects <= 0) return reject(new Error('Too many redirects'))
    const isHttps = url.startsWith('https')
    const client = isHttps ? https : http
    const opts = isHttps ? { agent: tlsAgent } : {}
    const req = client.get(url, opts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let loc = res.headers.location
        if (loc.startsWith('/')) loc = new URL(loc, url).href
        res.resume()
        return fetchBuffer(loc, redirects - 1).then(resolve, reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy()
      reject(new Error(`Timed out after ${TIMEOUT_MS / 1000}s: ${url}`))
    })
  })
}

export function fetchText(url) {
  return fetchBuffer(url).then(b => b.toString('utf-8'))
}
