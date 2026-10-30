// Bundesagentur für Arbeit — Jobsuche API (Almanya'nın resmi ilan veritabanı).
// Resmi bir SLA yok; BA sürümleri değiştirince eskiler 403 dönüyor (2026-10: arama sadece v6,
// detay sadece v4; dokümandaki v4/app ve v3 kapalı). Bu yüzden sürüm sabitlemiyoruz:
// aday listesini sırayla deniyoruz, çalışanı bir saat hatırlıyoruz. Yeni sürüm (v7…) çıkarsa
// kod değişmeden ona geçer. Doküman: https://github.com/bundesAPI/jobsuche-api
// Günlük sağlık kontrolü: /api/cron/keepalive → bozulursa info@cvzume.com'a e-posta.

export const BA_BASE = 'https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc'
export const BA_HEADERS = { 'X-API-Key': 'jobboerse-jobsuche', accept: 'application/json' }

const SEARCH_CANDIDATES = ['v6/jobs', 'v7/jobs', 'v8/jobs', 'v5/jobs', 'v4/app/jobs', 'v4/jobs']
const DETAIL_CANDIDATES = ['v4/jobdetails', 'v5/jobdetails', 'v6/jobdetails', 'v7/jobdetails', 'v3/jobdetails']
const REMEMBER_MS = 3600_000
const TIMEOUT_MS = 10_000

type Remembered = { path: string; at: number }
const working: { search?: Remembered; detail?: Remembered } = {}

// Geçici hatalar (5xx, zaman aşımı) için bir kez daha dene; 401/403/404 sürüm kapalı demek.
async function get(url: string): Promise<Response | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers: BA_HEADERS, signal: AbortSignal.timeout(TIMEOUT_MS) })
      if (res.status < 500) return res
    } catch { /* zaman aşımı / ağ hatası → tekrar */ }
  }
  return null
}

// Önce hatırlanan sürüm, sonra diğer adaylar. `accept` gövdenin beklenen biçimde olup olmadığına bakar.
async function tryCandidates<T>(
  kind: 'search' | 'detail',
  candidates: string[],
  build: (path: string) => string,
  accept: (data: unknown) => T | null,
): Promise<{ data: T; path: string } | null> {
  const mem = working[kind]
  const order = mem && Date.now() - mem.at < REMEMBER_MS
    ? [mem.path, ...candidates.filter(c => c !== mem.path)]
    : candidates
  for (const path of order) {
    const res = await get(build(path))
    if (!res || !res.ok) continue
    const body = await res.json().catch(() => null)
    const data = body ? accept(body) : null
    if (data === null) continue
    working[kind] = { path, at: Date.now() }
    return { data, path }
  }
  delete working[kind]
  return null
}

// Alan adları sürümler arasında değişiyor; hepsini tek biçime indir.
type Raw = Record<string, unknown>
const str = (v: unknown) => (typeof v === 'string' ? v : '')

function refOf(a: Raw): string {
  return str(a.referenznummer) || str(a.refnr) || str(a.hashId)
}

function locationOf(a: Raw): string {
  const lok = (a.stellenlokationen as { adresse?: { ort?: string } }[] | undefined)?.[0]?.adresse?.ort
  const ort = (a.arbeitsort as { ort?: string } | undefined)?.ort
  return lok || ort || ''
}

export const detailUrl = (refnr: string) => `https://www.arbeitsagentur.de/jobsuche/jobdetail/${encodeURIComponent(refnr)}`

export const searchUrl = (was: string, wo: string, umkreis: number) => {
  const q = new URLSearchParams({ angebotsart: '1' })
  if (was) q.set('was', was)
  if (wo) { q.set('wo', wo); q.set('umkreis', String(umkreis)) }
  return `https://www.arbeitsagentur.de/jobsuche/suche?${q}`
}

export type BaHit = { id: string; title: string; company: string; location: string; published: string; url: string; externalUrl: string }

export async function baSearch(opts: { was: string; wo: string; umkreis: number; page: number; size?: number }) {
  const params = new URLSearchParams({ size: String(opts.size ?? 20), page: String(opts.page), angebotsart: '1' })
  if (opts.was) params.set('was', opts.was)
  if (opts.wo) { params.set('wo', opts.wo); params.set('umkreis', String(opts.umkreis)) }

  const found = await tryCandidates('search', SEARCH_CANDIDATES, p => `${BA_BASE}/${p}?${params}`, body => {
    const d = body as Raw
    const list = (d.ergebnisliste ?? d.stellenangebote) as Raw[] | undefined
    // Boş sonuç geçerli bir cevap; ama liste alanı hiç yoksa biçim değişmiş demektir.
    if (!Array.isArray(list) && typeof d.maxErgebnisse !== 'number') return null
    return { total: Number(d.maxErgebnisse) || 0, list: list ?? [] }
  })
  if (!found) return null

  const hits: BaHit[] = found.data.list.map(a => {
    const id = refOf(a)
    return {
      id,
      title: str(a.stellenangebotsTitel) || str(a.titel) || str(a.beruf) || str(a.hauptberuf),
      company: str(a.firma) || str(a.arbeitgeber),
      location: locationOf(a),
      published: str(a.datumErsteVeroeffentlichung) || str(a.aktuelleVeroeffentlichungsdatum) || str(a.modifikationsTimestamp).slice(0, 10),
      url: detailUrl(id),
      externalUrl: str(a.externeURL) || str(a.externeUrl),
    }
  }).filter(h => h.id && h.title)
  return { total: found.data.total, hits, endpoint: found.path }
}

export type BaDetail = { id: string; title: string; company: string; location: string; text: string; url: string; endpoint: string }

export async function baDetail(refnr: string): Promise<BaDetail | null> {
  const id = Buffer.from(refnr).toString('base64')
  const found = await tryCandidates('detail', DETAIL_CANDIDATES, p => `${BA_BASE}/${p}/${id}`, body => {
    const a = body as Raw
    const text = (str(a.stellenangebotsBeschreibung) || str(a.stellenbeschreibung)).replace(/\r/g, '').trim()
    if (!text && !str(a.stellenangebotsTitel) && !str(a.titel)) return null
    return a
  })
  if (!found) return null
  const a = found.data
  return {
    id: refnr,
    title: str(a.stellenangebotsTitel) || str(a.titel) || str(a.hauptberuf),
    company: str(a.firma) || str(a.arbeitgeber),
    location: locationOf(a),
    text: (str(a.stellenangebotsBeschreibung) || str(a.stellenbeschreibung)).replace(/\r/g, '').trim(),
    url: str(a.externeURL) || detailUrl(refnr),
    endpoint: found.path,
  }
}
