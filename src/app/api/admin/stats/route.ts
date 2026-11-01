// Admin "Aktivite" istatistikleri: kayıt, başvuru, mektup sayıları (bugün/7/30 gün), 30 günlük günlük seri
// ve huni (kayıt → CV → başvuru → Pro). Sadece admin; veriler service role ile okunur, kişisel veri dönmez.
import { NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/admin'
import { getRequestUser, serviceClient } from '@/lib/server-auth'
import { getStripe } from '@/lib/stripe-plan'

export const maxDuration = 60

const DAY = 86_400_000
const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10)

export async function GET(request: Request) {
  const me = await getRequestUser(request)
  if (!me || !isAdminEmail(me.email)) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const db = serviceClient()

  // Kullanıcılar (sayfa sayfa)
  const users: { id: string; email?: string; created_at: string }[] = []
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    users.push(...data.users.map(u => ({ id: u.id, email: u.email, created_at: u.created_at })))
    if (data.users.length < 1000) break
  }

  const [{ data: apps }, { data: letters }, { data: profiles }] = await Promise.all([
    db.from('applications').select('user_id, created_at').limit(50000),
    db.from('applications').select('created_at').not('cover_letter', 'is', null).limit(50000),
    db.from('profiles').select('id, summary, experiences, skills, is_pro_override').limit(50000),
  ])

  // CV'si olanlar: deneyim, 20+ karakter özet ya da 3+ beceri (profile-store hasCvContent ile aynı ölçüt)
  const withCv = new Set<string>()
  const overrides = new Set<string>()
  for (const p of profiles || []) {
    const exp = Array.isArray(p.experiences) ? p.experiences.length : 0
    const skills = Array.isArray(p.skills) ? p.skills.length : 0
    if (exp > 0 || (p.summary || '').trim().length > 20 || skills > 2) withCv.add(p.id)
    if (p.is_pro_override) overrides.add(p.id)
  }
  const withApp = new Set((apps || []).map(a => a.user_id))

  // Pro: aktif Stripe abonelikleri (e-postayla eşleşen kullanıcılar) + elle verilen Pro
  const proEmails = new Set<string>()
  let newProThisMonth = 0
  const monthStart = new Date(); monthStart.setUTCDate(1); monthStart.setUTCHours(0, 0, 0, 0)
  try {
    const stripe = getStripe()
    for await (const sub of stripe.subscriptions.list({ status: 'active', limit: 100, expand: ['data.customer'] })) {
      const c = sub.customer as { email?: string | null }
      if (c?.email) proEmails.add(c.email.toLowerCase())
      if (sub.created * 1000 >= monthStart.getTime()) newProThisMonth++
    }
  } catch (e) { console.error('admin stats stripe', e) }
  const proIds = new Set(users.filter(u => (u.email && proEmails.has(u.email.toLowerCase())) || overrides.has(u.id)).map(u => u.id))

  const now = Date.now()
  const since = (ms: number) => (d: string) => now - new Date(d).getTime() < ms
  const todayKey = dayKey(new Date())
  const period = (dates: string[]) => ({
    today: dates.filter(d => dayKey(d) === todayKey).length,
    d7: dates.filter(since(7 * DAY)).length,
    d30: dates.filter(since(30 * DAY)).length,
    total: dates.length,
  })

  // Son 30 günün günlük serisi (bugün dahil)
  const days = Array.from({ length: 30 }, (_, i) => dayKey(new Date(now - (29 - i) * DAY)))
  const series = (dates: string[]) => {
    const m = new Map(days.map(d => [d, 0]))
    for (const d of dates) { const k = dayKey(d); if (m.has(k)) m.set(k, m.get(k)! + 1) }
    return days.map(d => ({ day: d, n: m.get(d)! }))
  }
  const signupDates = users.map(u => u.created_at)
  const appDates = (apps || []).map(a => a.created_at as string)

  return NextResponse.json({
    signups: period(signupDates),
    applications: period(appDates),
    letters: period((letters || []).map(l => l.created_at as string)),
    newProThisMonth,
    funnel: {
      registered: users.length,
      withCv: users.filter(u => withCv.has(u.id)).length,
      withApplication: users.filter(u => withApp.has(u.id)).length,
      pro: proIds.size,
    },
    daily: { signups: series(signupDates), applications: series(appDates) },
  })
}
