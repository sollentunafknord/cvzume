// Dış iş ilanı kaynaklarının günlük sağlık kontrolü (keepalive cron'u çağırır).
// Bir kaynak bozulursa info@cvzume.com'a e-posta gider — kullanıcılar şikâyet etmeden önce haberimiz olsun.
import { baDetail, baSearch } from './arbeitsagentur'
import { ijSearch, infojobsConfigured } from './infojobs'
import { adzunaConfigured, adzunaSearch } from './adzuna'

export type SourceCheck = { source: string; ok: boolean; detail: string }

async function checkBundesagentur(): Promise<SourceCheck[]> {
  const search = await baSearch({ was: 'Verkäufer', wo: 'Berlin', umkreis: 25, page: 1, size: 3 }).catch(() => null)
  if (!search) return [{ source: 'Bundesagentur (arama)', ok: false, detail: 'Hiçbir arama sürümü (v6, v7, v8, v5, v4/app, v4) yanıt vermedi.' }]
  const checks: SourceCheck[] = [{ source: 'Bundesagentur (arama)', ok: search.hits.length > 0, detail: `${search.endpoint}: ${search.total} ilan` }]
  const first = search.hits[0]
  if (first) {
    const d = await baDetail(first.id).catch(() => null)
    checks.push(d && d.text.length > 50
      ? { source: 'Bundesagentur (detay)', ok: true, detail: `${d.endpoint}: ${d.text.length} karakter` }
      : { source: 'Bundesagentur (detay)', ok: false, detail: `Hiçbir detay sürümü çalışmadı (refnr ${first.id}). Analiz şimdilik işveren sayfası yedeğiyle çalışır.` })
  }
  return checks
}

async function checkPlatsbanken(): Promise<SourceCheck> {
  try {
    const res = await fetch('https://jobsearch.api.jobtechdev.se/search?limit=1&q=lager', { signal: AbortSignal.timeout(10_000) })
    const d = res.ok ? await res.json() : null
    const n = d?.total?.value ?? 0
    return { source: 'Platsbanken (JobTech)', ok: n > 0, detail: res.ok ? `${n} ilan` : `HTTP ${res.status}` }
  } catch (e) {
    return { source: 'Platsbanken (JobTech)', ok: false, detail: String(e) }
  }
}

async function checkInfoJobs(): Promise<SourceCheck[]> {
  if (!infojobsConfigured()) return [] // anahtar eklenmeden kontrol edilecek bir şey yok
  try {
    const r = await ijSearch({ q: 'camarero', province: '', page: 1 })
    return [{ source: 'InfoJobs (İspanya)', ok: r.hits.length > 0, detail: `${r.total} ilan` }]
  } catch (e) {
    return [{ source: 'InfoJobs (İspanya)', ok: false, detail: e instanceof Error ? e.message : String(e) }]
  }
}

async function checkAdzuna(): Promise<SourceCheck[]> {
  if (!adzunaConfigured()) return []
  try {
    const r = await adzunaSearch({ country: 'es', what: 'camarero', where: '', page: 1 })
    return [{ source: 'Adzuna (İspanya)', ok: r.hits.length > 0, detail: `${r.total} ilan` }]
  } catch (e) {
    return [{ source: 'Adzuna (İspanya)', ok: false, detail: e instanceof Error ? e.message : String(e) }]
  }
}

export async function checkSources(): Promise<SourceCheck[]> {
  const [ba, pb, ij, az] = await Promise.all([checkBundesagentur(), checkPlatsbanken(), checkInfoJobs(), checkAdzuna()])
  return [...ba, pb, ...ij, ...az]
}

export async function alertIfBroken(checks: SourceCheck[]): Promise<boolean> {
  const broken = checks.filter(c => !c.ok)
  const key = process.env.RESEND_API_KEY
  if (broken.length === 0 || !key) return false
  const rows = checks.map(c => `${c.ok ? '✅' : '❌'} ${c.source} — ${c.detail}`).join('\n')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'CVzume <noreply@cvzume.com>',
      to: ['info@cvzume.com'],
      subject: `CVzume: ${broken.map(b => b.source).join(', ')} çalışmıyor`,
      text: `Günlük kaynak kontrolü (${new Date().toISOString()}):\n\n${rows}\n\nBundesagentur için ilk bakılacak yer: src/lib/arbeitsagentur.ts (aday sürüm listeleri) ve https://github.com/bundesAPI/jobsuche-api`,
    }),
    signal: AbortSignal.timeout(10_000),
  }).catch(() => null)
  return !!res?.ok
}
