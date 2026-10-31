// "Şifremi unuttum": Supabase'in şifre sıfırlama e-postasını gönderir. Link /<dil>/auth?mode=reset'e döner.
// Hesap var mı yok mu belli olmasın diye her zaman { ok: true } döner.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { clientIp, rateLimit } from '@/lib/server-auth'

const LOCALES = ['sv', 'en', 'es', 'tr', 'de']

export async function POST(request: Request) {
  if (!rateLimit(`forgot:${clientIp(request)}`, 10)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const { email, locale } = await request.json().catch(() => ({}))
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) return NextResponse.json({ error: 'bad_email' }, { status: 400 })
  const mail = email.trim().toLowerCase()
  if (!rateLimit(`forgot:${mail}`, 3)) return NextResponse.json({ ok: true })
  const loc = LOCALES.includes(locale) ? locale : 'sv'
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cvzume.com'
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
  const { error } = await supabase.auth.resetPasswordForEmail(mail, { redirectTo: `${site}/${loc}/auth?mode=reset` })
  if (error) console.error('forgot password', error.message)
  return NextResponse.json({ ok: true })
}
