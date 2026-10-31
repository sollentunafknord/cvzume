// "Şifremi unuttum": sıfırlama linkini Supabase'ten alır, e-postayı kendimiz (noreply@cvzume.com) göndeririz.
// Link /<dil>/auth?mode=reset'e döner.
// Hesap var mı yok mu belli olmasın diye her zaman { ok: true } döner.
import { NextResponse } from 'next/server'
import { clientIp, rateLimit, serviceClient } from '@/lib/server-auth'
import { sendResetEmail } from '@/lib/reset-email'

const LOCALES = ['sv', 'en', 'es', 'tr', 'de']

export async function POST(request: Request) {
  if (!rateLimit(`forgot:${clientIp(request)}`, 10)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const { email, locale } = await request.json().catch(() => ({}))
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) return NextResponse.json({ error: 'bad_email' }, { status: 400 })
  const mail = email.trim().toLowerCase()
  if (!rateLimit(`forgot:${mail}`, 3)) return NextResponse.json({ ok: true })
  const loc = LOCALES.includes(locale) ? locale : 'sv'
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cvzume.com'
  const { data, error } = await serviceClient().auth.admin.generateLink({ type: 'recovery', email: mail, options: { redirectTo: `${site}/${loc}/auth?mode=reset` } })
  // Hesap yoksa generateLink hata verir; dışarıya yine "tamam" deriz
  if (error || !data?.properties?.action_link) { if (error && !/not found/i.test(error.message)) console.error('forgot password', error.message); return NextResponse.json({ ok: true }) }
  await sendResetEmail(mail, data.properties.action_link, loc)
  return NextResponse.json({ ok: true })
}
