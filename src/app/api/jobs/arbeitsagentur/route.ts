// Bundesagentur für Arbeit araması ve ilan detayı. Sürüm yedekleri: src/lib/arbeitsagentur.ts
import { NextResponse } from 'next/server'
import { baDetail, baSearch, searchUrl } from '@/lib/arbeitsagentur'
import { fetchAdFromUrl } from '@/lib/fetch-ad'

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams

  // Tek ilan: analiz için tam metin
  const detail = sp.get('detail')
  if (detail) {
    const ad = await baDetail(detail).catch(() => null)
    if (ad && ad.text.length >= 50) return NextResponse.json(ad)
    // Yedek: BA detay API'si kapalıysa ilanın işveren sitesindeki asıl sayfası
    const ext = sp.get('ext')
    if (ext) {
      try {
        const page = await fetchAdFromUrl(ext)
        return NextResponse.json({ id: detail, title: page.title, company: page.company, location: page.location, text: page.text, url: ext, endpoint: 'external' })
      } catch { /* aşağıda hata */ }
    }
    return NextResponse.json({ error: ad ? 'no_content' : 'unavailable' }, { status: 502 })
  }

  const was = (sp.get('was') || '').trim().slice(0, 100)
  const wo = (sp.get('wo') || '').trim().slice(0, 100)
  const umkreis = Math.min(200, Math.max(0, Number(sp.get('umkreis')) || 25))
  const page = Math.max(1, Number(sp.get('page')) || 1)

  const result = await baSearch({ was, wo, umkreis, page }).catch(() => null)
  if (!result) {
    // Arayüz bu linkle aynı aramayı arbeitsagentur.de'de açmayı önerir
    return NextResponse.json({ error: 'unavailable', fallbackUrl: searchUrl(was, wo, umkreis) }, { status: 503 })
  }
  return NextResponse.json({ total: result.total, hits: result.hits })
}
