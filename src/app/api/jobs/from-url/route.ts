// İlan linki → ilan metni. Landing demo'su ve "Ny ansökan" penceresi kullanır.
import { NextResponse } from 'next/server'
import { fetchAdFromUrl, AdFetchError } from '@/lib/fetch-ad'

export const dynamic = 'force-dynamic'

// Basit bellek içi fren: AI çağrısı yok, sadece dış siteye istek — IP başına saatte 30.
const hits = new Map<string, number[]>()

function allow(ip: string): boolean {
  const hour = Date.now() - 3600_000
  const list = (hits.get(ip) ?? []).filter(t => t > hour)
  if (list.length >= 30) return false
  list.push(Date.now())
  hits.set(ip, list)
  if (hits.size > 5000) hits.clear()
  return true
}

export async function POST(request: Request) {
  const { url } = await request.json().catch(() => ({ url: '' }))
  if (typeof url !== 'string' || !url.trim() || url.length > 2000) {
    return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
  }

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown'
  if (!allow(ip)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  try {
    const ad = await fetchAdFromUrl(url)
    return NextResponse.json(ad)
  } catch (err) {
    const code = err instanceof AdFetchError ? err.code : 'fetch_failed'
    if (!(err instanceof AdFetchError)) console.error('from-url failed', err)
    return NextResponse.json({ error: code }, { status: code === 'invalid_url' ? 400 : 422 })
  }
}
