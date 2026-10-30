// Bundesagentur für Arbeit araması ve ilan detayı. Yardımcılar: src/lib/arbeitsagentur.ts
import { NextResponse } from 'next/server'
import { BA_BASE, BA_HEADERS, baLocation, detailUrl, fetchBaDetail, type Angebot } from '@/lib/arbeitsagentur'

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams

  // Tek ilan: analiz için tam metin
  const detail = sp.get('detail')
  if (detail) {
    try {
      const ad = await fetchBaDetail(detail)
      if (!ad) return NextResponse.json({ error: 'not_found' }, { status: 404 })
      return NextResponse.json(ad)
    } catch {
      return NextResponse.json({ error: 'fetch_failed' }, { status: 502 })
    }
  }

  const params = new URLSearchParams({
    size: '20',
    page: String(Math.max(1, Number(sp.get('page')) || 1)),
    angebotsart: '1', // 1 = Arbeit (iş ilanları; staj/eğitim hariç)
  })
  const was = (sp.get('was') || '').trim().slice(0, 100)
  const wo = (sp.get('wo') || '').trim().slice(0, 100)
  if (was) params.set('was', was)
  if (wo) {
    params.set('wo', wo)
    params.set('umkreis', String(Math.min(200, Math.max(0, Number(sp.get('umkreis')) || 25))))
  }

  try {
    const res = await fetch(`${BA_BASE}/v6/jobs?${params}`, { headers: BA_HEADERS, signal: AbortSignal.timeout(10_000) })
    if (!res.ok) return NextResponse.json({ error: 'fetch_failed' }, { status: 502 })
    const d = await res.json()
    const list: Angebot[] = d.ergebnisliste || d.stellenangebote || []
    const hits = list.map(a => ({
      id: a.referenznummer,
      title: a.stellenangebotsTitel || a.titel || a.hauptberuf || '',
      company: a.firma || '',
      location: baLocation(a),
      published: a.datumErsteVeroeffentlichung || a.aktuelleVeroeffentlichungsdatum || '',
      url: detailUrl(a.referenznummer),
    }))
    return NextResponse.json({ total: d.maxErgebnisse || 0, hits })
  } catch {
    return NextResponse.json({ error: 'fetch_failed' }, { status: 502 })
  }
}
