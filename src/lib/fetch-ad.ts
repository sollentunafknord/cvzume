// İlan linkinden ilan metnini çıkarır.
// 1) Platsbanken → JobTech API (sayfa JS ile yükleniyor, HTML'de metin yok)
// 2) Diğer siteler → schema.org JobPosting (JSON-LD), yoksa sayfanın ana metni
// Kullanıcının verdiği URL'ye sunucudan istek atıyoruz: iç ağ adreslerini (SSRF) engelle.
import * as cheerio from 'cheerio'
import { lookup } from 'dns/promises'
import { isIP } from 'net'

export type FetchedAd = { title: string; company: string; location: string; text: string; source: string }

export class AdFetchError extends Error {
  constructor(public code: 'invalid_url' | 'blocked' | 'fetch_failed' | 'no_content') {
    super(code)
  }
}

const MAX_BYTES = 2_000_000
const MAX_TEXT = 6000
const TIMEOUT_MS = 8000

function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) {
    const v = ip.toLowerCase()
    if (v.startsWith('::ffff:')) return isPrivateIp(v.slice(7))
    return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80')
  }
  const [a, b] = ip.split('.').map(Number)
  return (
    a === 10 || a === 127 || a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a >= 224
  )
}

async function assertPublicUrl(url: URL) {
  if (url.protocol !== 'https:' && url.protocol !== 'http:') throw new AdFetchError('invalid_url')
  if (url.username || url.password) throw new AdFetchError('invalid_url')
  if (url.port && url.port !== '80' && url.port !== '443') throw new AdFetchError('blocked')
  const host = url.hostname.replace(/^\[|\]$/g, '')
  if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) throw new AdFetchError('blocked')
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true }).catch(() => [])
  if (addrs.length === 0) throw new AdFetchError('fetch_failed')
  if (addrs.some(a => isPrivateIp(a.address))) throw new AdFetchError('blocked')
}

function cleanText(s: string): string {
  return s
    .replace(/\r/g, '')
    .replace(/[ \t ]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function htmlToText(html: string): string {
  const $ = cheerio.load(`<div id="x">${html}</div>`)
  $('br').replaceWith('\n')
  $('p, li, h1, h2, h3, h4, div').each((_, el) => { $(el).append('\n') })
  $('li').each((_, el) => { $(el).prepend('- ') })
  return cleanText($('#x').text())
}

async function fromPlatsbanken(id: string): Promise<FetchedAd> {
  const res = await fetch(`https://jobsearch.api.jobtechdev.se/ad/${id}`, {
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (res.status === 404) throw new AdFetchError('no_content')
  if (!res.ok) throw new AdFetchError('fetch_failed')
  const d = await res.json()
  const title = d.headline || ''
  const company = d.employer?.name || ''
  const location = d.workplace_address?.municipality || ''
  const body = d.description?.text || ''
  if (!body) throw new AdFetchError('no_content')
  return { title, company, location, text: compose(title, company, location, body), source: 'platsbanken' }
}

function compose(title: string, company: string, location: string, body: string): string {
  const head = [title, [company, location].filter(Boolean).join(' · ')].filter(Boolean).join('\n')
  return cleanText(`${head}\n\n${body}`).slice(0, MAX_TEXT)
}

type JsonLd = Record<string, unknown>

function findJobPosting(node: unknown): JsonLd | null {
  if (!node || typeof node !== 'object') return null
  if (Array.isArray(node)) {
    for (const n of node) {
      const hit = findJobPosting(n)
      if (hit) return hit
    }
    return null
  }
  const obj = node as JsonLd
  const type = obj['@type']
  if (type === 'JobPosting' || (Array.isArray(type) && type.includes('JobPosting'))) return obj
  return findJobPosting(obj['@graph'])
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function locationOf(jp: JsonLd): string {
  const loc = Array.isArray(jp.jobLocation) ? jp.jobLocation[0] : jp.jobLocation
  const addr = (loc as JsonLd | undefined)?.address as JsonLd | string | undefined
  if (typeof addr === 'string') return addr
  return str(addr?.addressLocality)
}

async function fetchHtml(start: URL): Promise<{ html: string; url: URL }> {
  let url = start
  for (let hop = 0; hop < 4; hop++) {
    await assertPublicUrl(url)
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        'user-agent': 'Mozilla/5.0 (compatible; CVzumeBot/1.0; +https://www.cvzume.com)',
        accept: 'text/html,application/xhtml+xml',
        'accept-language': 'sv,en;q=0.8',
      },
    }).catch(() => { throw new AdFetchError('fetch_failed') })

    if (res.status >= 300 && res.status < 400 && res.headers.get('location')) {
      url = new URL(res.headers.get('location')!, url)
      continue
    }
    if (!res.ok) throw new AdFetchError('fetch_failed')
    const type = res.headers.get('content-type') || ''
    if (!type.includes('html')) throw new AdFetchError('no_content')

    const reader = res.body?.getReader()
    if (!reader) throw new AdFetchError('fetch_failed')
    const chunks: Uint8Array[] = []
    let size = 0
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.length
      if (size > MAX_BYTES) { await reader.cancel(); break }
      chunks.push(value)
    }
    return { html: Buffer.concat(chunks).toString('utf8'), url }
  }
  throw new AdFetchError('fetch_failed')
}

export async function fetchAdFromUrl(raw: string): Promise<FetchedAd> {
  let url: URL
  try {
    url = new URL(raw.trim())
  } catch {
    throw new AdFetchError('invalid_url')
  }

  // Teamtailor vb.: başvuru formu linki → ilan sayfası
  url.pathname = url.pathname.replace(/\/applications\/new\/?$/, '')

  const pb = url.hostname.endsWith('arbetsformedlingen.se') && url.pathname.match(/\/platsbanken\/annonser\/(\d+)/)
  if (pb) return fromPlatsbanken(pb[1])

  const { html, url: finalUrl } = await fetchHtml(url)
  const $ = cheerio.load(html)
  const source = finalUrl.hostname.replace(/^www\./, '')

  // 1) JSON-LD JobPosting
  let jp: JsonLd | null = null
  $('script[type="application/ld+json"]').each((_, el) => {
    if (jp) return
    try { jp = findJobPosting(JSON.parse($(el).text())) } catch { /* bozuk JSON-LD */ }
  })
  if (jp) {
    const posting = jp as JsonLd
    const org = posting.hiringOrganization as JsonLd | string | undefined
    const company = typeof org === 'string' ? org : str(org?.name)
    const body = htmlToText(str(posting.description))
    if (body.length > 80) {
      const title = str(posting.title)
      const location = locationOf(posting)
      return { title, company, location, text: compose(title, company, location, body), source }
    }
  }

  // 2) Sayfanın ana metni
  const title = cleanText($('meta[property="og:title"]').attr('content') || $('title').text() || '')
  $('script, style, noscript, svg, nav, header, footer, form, iframe, [aria-hidden="true"]').remove()
  const root = $('main').first().length ? $('main').first() : $('article').first().length ? $('article').first() : $('body')
  root.find('br').replaceWith('\n')
  root.find('p, li, h1, h2, h3, h4, div, section').each((_, el) => { $(el).append('\n') })
  const body = cleanText(root.text())
  if (body.length < 200) throw new AdFetchError('no_content')
  return { title, company: '', location: '', text: compose(title, '', '', body), source }
}
