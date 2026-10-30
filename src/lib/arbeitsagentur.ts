// Bundesagentur für Arbeit — Jobsuche API (Almanya'nın resmi ilan veritabanı).
// Herkese açık anahtar "jobboerse-jobsuche". Arama v6'da, ilan detayı v4'te çalışıyor
// (2026-10: v4 arama ve v6 detay 403 dönüyor). Detayda referans numarası base64 kodlanır.
export const BA_BASE = 'https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc'
export const BA_HEADERS = { 'X-API-Key': 'jobboerse-jobsuche', accept: 'application/json' }

export type Lokation = { adresse?: { ort?: string; plz?: string; region?: string } }
export type Angebot = {
  referenznummer: string
  stellenangebotsTitel?: string
  titel?: string
  firma?: string
  hauptberuf?: string
  stellenlokationen?: Lokation[]
  arbeitsort?: { ort?: string }
  datumErsteVeroeffentlichung?: string
  aktuelleVeroeffentlichungsdatum?: string
  externeURL?: string
  stellenangebotsBeschreibung?: string
}

export function baLocation(a: Angebot): string {
  const adr = a.stellenlokationen?.[0]?.adresse
  return adr?.ort || a.arbeitsort?.ort || ''
}

export const detailUrl = (refnr: string) => `https://www.arbeitsagentur.de/jobsuche/jobdetail/${encodeURIComponent(refnr)}`

export async function fetchBaDetail(refnr: string) {
  const id = Buffer.from(refnr).toString('base64')
  const res = await fetch(`${BA_BASE}/v4/jobdetails/${id}`, { headers: BA_HEADERS, signal: AbortSignal.timeout(10_000) })
  if (!res.ok) return null
  const a = (await res.json()) as Angebot
  return {
    id: refnr,
    title: a.stellenangebotsTitel || a.titel || a.hauptberuf || '',
    company: a.firma || '',
    location: baLocation(a),
    text: (a.stellenangebotsBeschreibung || '').replace(/\r/g, '').trim(),
    url: a.externeURL || detailUrl(refnr),
  }
}

