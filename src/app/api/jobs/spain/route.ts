// İspanya iş araması: önce InfoJobs (anahtar varsa), yoksa/çökerse Adzuna.
// InfoJobs yeni uygulama kaydını kapattığı için (2026-10) geçici olarak Adzuna; InfoJobs anahtarları
// Vercel'e eklendiği anda kod değişmeden InfoJobs'a geçer. Yardımcılar: src/lib/infojobs.ts, adzuna.ts
import { NextResponse } from 'next/server'
import { ijDetail, ijProvinces, ijSearch, infojobsConfigured, infojobsSearchUrl } from '@/lib/infojobs'
import { adzunaConfigured, adzunaSearch } from '@/lib/adzuna'
import { fetchAdFromUrl } from '@/lib/fetch-ad'

type Provider = 'infojobs' | 'adzuna'

function providers(): Provider[] {
  return [infojobsConfigured() && 'infojobs', adzunaConfigured() && 'adzuna'].filter(Boolean) as Provider[]
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  const q = (sp.get('q') || '').trim().slice(0, 100)
  const list = providers()
  const none = () => NextResponse.json({ error: 'not_configured', fallbackUrl: infojobsSearchUrl(q) }, { status: 503 })

  // Arayüz hangi sağlayıcıyla çalıştığını öğrenir (il listesi mi, serbest şehir alanı mı)
  if (sp.get('meta')) {
    for (const p of list) {
      if (p === 'adzuna') return NextResponse.json({ provider: 'adzuna' })
      const provinces = await ijProvinces().catch(() => null)
      if (provinces) return NextResponse.json({ provider: 'infojobs', provinces })
    }
    return NextResponse.json({ provider: 'none' })
  }

  // Analiz için tam metin
  const detail = sp.get('detail')
  if (detail) {
    const via = sp.get('provider') as Provider | null
    try {
      if (via === 'infojobs') {
        const ad = await ijDetail(detail)
        if (ad.text.length >= 50) return NextResponse.json(ad)
      } else if (via === 'adzuna') {
        // Adzuna sadece kısa özet veriyor → ilanın sayfası okunur. Sadece Adzuna linklerine izin ver.
        const url = sp.get('url') || ''
        if (/^https:\/\/([a-z0-9-]+\.)*adzuna\.[a-z.]+\//i.test(url)) {
          const page = await fetchAdFromUrl(url)
          return NextResponse.json({ id: detail, title: page.title, company: page.company, location: page.location, text: page.text, url })
        }
      }
    } catch { /* aşağıda */ }
    return NextResponse.json({ error: 'no_content' }, { status: 502 })
  }

  if (list.length === 0) return none()
  const page = Math.max(1, Number(sp.get('page')) || 1)
  for (const p of list) {
    try {
      if (p === 'infojobs') {
        const province = (sp.get('province') || '').replace(/\D/g, '').slice(0, 4)
        return NextResponse.json({ provider: p, ...(await ijSearch({ q, province, page })) })
      }
      const where = (sp.get('where') || '').trim().slice(0, 100)
      return NextResponse.json({ provider: p, ...(await adzunaSearch({ country: 'es', what: q, where, page })) })
    } catch (err) {
      console.warn(`spain search: ${p} failed`, err instanceof Error ? err.message : err)
    }
  }
  return NextResponse.json({ error: 'unavailable', fallbackUrl: infojobsSearchUrl(q) }, { status: 503 })
}
