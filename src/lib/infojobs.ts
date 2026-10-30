// InfoJobs (İspanya'nın en büyük iş sitesi) resmi API'si. https://developer.infojobs.net
// Kimlik: HTTP Basic, INFOJOBS_CLIENT_ID:INFOJOBS_CLIENT_SECRET (Vercel env). Anahtar yoksa
// route 'not_configured' döner ve arayüz aramayı infojobs.net'te açan linke düşer.
// Sürümler: arama /api/9/offer, detay /api/7/offer/{id} (doküman 2026-10). Bundesagentur'daki
// gibi sabitlemiyoruz; aday sürümler sırayla denenir, çalışan bir saat hatırlanır.

const API = 'https://api.infojobs.net/api'
const SEARCH_VERSIONS = ['9', '10', '8', '7']
const DETAIL_VERSIONS = ['7', '8', '9', '6']
const REMEMBER_MS = 3600_000
const TIMEOUT_MS = 10_000

export class InfoJobsError extends Error {
  constructor(public code: 'not_configured' | 'unauthorized' | 'unavailable' | 'not_found') { super(code) }
}

export function infojobsConfigured(): boolean {
  return !!(process.env.INFOJOBS_CLIENT_ID && process.env.INFOJOBS_CLIENT_SECRET)
}

function authHeader(): string {
  const id = process.env.INFOJOBS_CLIENT_ID
  const secret = process.env.INFOJOBS_CLIENT_SECRET
  if (!id || !secret) throw new InfoJobsError('not_configured')
  return `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`
}

async function isCredentialError(r: Response): Promise<boolean> {
  const body = await r.json().catch(() => null) as { error?: string } | null
  return body?.error === '102' || body?.error === '103'
}

const working: { search?: { v: string; at: number }; detail?: { v: string; at: number } } = {}

async function request(kind: 'search' | 'detail', versions: string[], path: (v: string) => string): Promise<Record<string, unknown>> {
  const auth = authHeader()
  const mem = working[kind]
  const order = mem && Date.now() - mem.at < REMEMBER_MS ? [mem.v, ...versions.filter(v => v !== mem.v)] : versions
  for (const v of order) {
    let res: Response | null = null
    for (let attempt = 0; attempt < 2 && !res; attempt++) {
      try {
        const r = await fetch(`${API}/${path(v)}`, { headers: { Authorization: auth, accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) })
        if (r.status < 500) res = r
        // Geçersiz anahtar 401 değil 500 + {"error":"103"} dönüyor (102: anahtar yok)
        else if (await isCredentialError(r)) throw new InfoJobsError('unauthorized')
      } catch (e) { if (e instanceof InfoJobsError) throw e /* aksi halde zaman aşımı → tekrar */ }
    }
    if (!res) continue
    if (res.status === 401) throw new InfoJobsError('unauthorized') // anahtar yanlış: diğer sürümler de reddeder
    if (res.status === 404 && kind === 'detail') {
      // İlan yok mu, sürüm mü kapalı? Gövde InfoJobs hata biçimindeyse ilan yoktur.
      const body = await res.json().catch(() => null)
      if (body && 'error' in body) throw new InfoJobsError('not_found')
      continue
    }
    if (!res.ok) continue
    const body = await res.json().catch(() => null)
    if (!body) continue
    working[kind] = { v, at: Date.now() }
    return body
  }
  delete working[kind]
  throw new InfoJobsError('unavailable')
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

// Yedek link: sadece anahtar kelime (portalın il parametresi belgelenmemiş)
export const infojobsSearchUrl = (q: string) =>
  `https://www.infojobs.net/jobsearch/search-results/list.xhtml${q ? `?keyword=${encodeURIComponent(q)}` : ''}`

// İl sözlüğü (id → ad). Nadiren değişir; bir gün önbellekte tutulur.
let provinceCache: { at: number; list: { id: string; name: string }[] } | null = null

export async function ijProvinces(): Promise<{ id: string; name: string }[]> {
  if (provinceCache && Date.now() - provinceCache.at < 24 * 3600_000) return provinceCache.list
  const res = await fetch(`${API}/1/dictionary/province`, { headers: { Authorization: authHeader(), accept: 'application/json' }, signal: AbortSignal.timeout(TIMEOUT_MS) })
  if (res.status === 401) throw new InfoJobsError('unauthorized')
  if (!res.ok) throw new InfoJobsError('unavailable')
  const raw = (await res.json()) as { id?: number; value?: string; order?: number }[]
  const list = raw
    .filter(p => p.id && p.value && p.id > 0)
    .sort((a, b) => (a.value || '').localeCompare(b.value || '', 'es'))
    .map(p => ({ id: String(p.id), name: String(p.value) }))
  provinceCache = { at: Date.now(), list }
  return list
}

export type IjHit = { id: string; title: string; company: string; location: string; published: string; url: string }

export async function ijSearch(opts: { q: string; province: string; page: number }) {
  const params = new URLSearchParams({ maxResults: '20', page: String(opts.page), order: 'relevancia-desc' })
  if (opts.q) params.set('q', opts.q)
  if (opts.province) params.set('provinceIds', opts.province)
  const d = await request('search', SEARCH_VERSIONS, v => `${v}/offer?${params}`)
  const offers = (d.offers as Record<string, unknown>[] | undefined) ?? []
  const hits: IjHit[] = offers.map(o => ({
    id: str(o.id),
    title: str(o.title),
    company: str((o.author as Record<string, unknown> | undefined)?.name),
    location: [str(o.city), str((o.province as Record<string, unknown> | undefined)?.value)].filter(Boolean).filter((x, i, a) => a.indexOf(x) === i).join(', '),
    published: str(o.published).slice(0, 10),
    url: str(o.link),
  })).filter(h => h.id && h.title)
  return { total: Number(d.totalResults) || 0, totalPages: Number(d.totalPages) || 0, hits }
}

export async function ijDetail(id: string) {
  const o = await request('detail', DETAIL_VERSIONS, v => `${v}/offer/${encodeURIComponent(id)}`)
  const sections = [
    str(o.description),
    str(o.minRequirements) && `Requisitos mínimos:\n${str(o.minRequirements)}`,
    str(o.desiredRequirements) && `Requisitos deseados:\n${str(o.desiredRequirements)}`,
  ].filter(Boolean)
  return {
    id,
    title: str(o.title),
    company: str((o.profile as Record<string, unknown> | undefined)?.name),
    location: str(o.city),
    text: sections.join('\n\n').replace(/\r/g, '').trim(),
    url: str(o.link) || `https://www.infojobs.net/of-i${id}`,
  }
}

// infojobs.net ilan linklerindeki kimlik: …/of-i<32 hex>
export function infojobsIdFromUrl(url: URL): string | null {
  if (!url.hostname.endsWith('infojobs.net')) return null
  const m = url.pathname.match(/of-i([0-9a-f]{20,})/i)
  return m ? m[1] : null
}
