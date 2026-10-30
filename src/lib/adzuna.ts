// Adzuna iş ilanı API'si (İspanya için InfoJobs açılana kadar). https://developer.adzuna.com
// Anahtarlar: ADZUNA_APP_ID / ADZUNA_APP_KEY (Vercel env). Not: API ilan açıklamasının yalnızca
// bir parçasını verir; tam metin için redirect_url'deki sayfa fetch-ad ile okunur (her sitede olmaz).

const API = 'https://api.adzuna.com/v1/api/jobs'
const TIMEOUT_MS = 10_000

export class AdzunaError extends Error {
  constructor(public code: 'not_configured' | 'unauthorized' | 'quota' | 'unavailable') { super(code) }
}

export function adzunaConfigured(): boolean {
  return !!(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY)
}

const str = (v: unknown) => (typeof v === 'string' ? v : '')

export type AdzunaHit = { id: string; title: string; company: string; location: string; published: string; url: string; snippet: string }

export async function adzunaSearch(opts: { country: string; what: string; where: string; page: number }) {
  const id = process.env.ADZUNA_APP_ID
  const key = process.env.ADZUNA_APP_KEY
  if (!id || !key) throw new AdzunaError('not_configured')

  const params = new URLSearchParams({ app_id: id, app_key: key, results_per_page: '20', 'content-type': 'application/json' })
  if (opts.what) params.set('what', opts.what)
  if (opts.where) params.set('where', opts.where)

  let res: Response | null = null
  for (let attempt = 0; attempt < 2 && !res; attempt++) {
    try {
      // Ücretsiz katman sorgu sayısıyla sınırlı → aynı arama bir saat Vercel Data Cache'ten döner,
      // kaç kullanıcı ararsa arasın Adzuna'ya tek istek gider.
      const r = await fetch(`${API}/${opts.country}/search/${opts.page}?${params}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
        next: { revalidate: 3600 },
      })
      if (r.status < 500) res = r
    } catch { /* zaman aşımı → tekrar */ }
  }
  if (!res) throw new AdzunaError('unavailable')
  if (res.status === 429) throw new AdzunaError('quota')
  if (res.status === 401 || res.status === 403) throw new AdzunaError('unauthorized')
  if (!res.ok) throw new AdzunaError('unavailable')

  const d = await res.json() as { count?: number; results?: Record<string, unknown>[] }
  const hits: AdzunaHit[] = (d.results ?? []).map(r => ({
    id: String(r.id ?? ''),
    title: str(r.title).replace(/<[^>]+>/g, ''),
    company: str((r.company as Record<string, unknown> | undefined)?.display_name),
    location: str((r.location as Record<string, unknown> | undefined)?.display_name),
    published: str(r.created).slice(0, 10),
    url: str(r.redirect_url),
    snippet: str(r.description).replace(/<[^>]+>/g, ''),
  })).filter(h => h.id && h.title && h.url)
  const total = Number(d.count) || 0
  return { total, totalPages: Math.ceil(total / 20), hits }
}
