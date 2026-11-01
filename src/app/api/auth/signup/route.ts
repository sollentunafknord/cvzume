// Kayıt: kullanıcıyı oluşturur ve doğrulama e-postasını kendimiz göndeririz (noreply@cvzume.com, kullanıcının dilinde).
// Link /<dil>/auth?mode=confirmed#access_token=… adresine döner; AuthClient oturumu açar.
import { NextResponse } from 'next/server'
import { clientIp, rateLimit, serviceClient } from '@/lib/server-auth'
import { sendConfirmEmail } from '@/lib/confirm-email'

const LOCALES = ['sv', 'en', 'es', 'tr', 'de']

export async function POST(request: Request) {
  // Supabase'in IP başına sınırı Vercel'in IP'sini görür; saldırgana karşı fren burada
  if (!rateLimit(`signup:${clientIp(request)}`, 5)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const { email, password, firstName, lastName, locale } = await request.json().catch(() => ({}))
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim()) || typeof password !== 'string') return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password should be at least 8 characters' }, { status: 400 })
  const loc = LOCALES.includes(locale) ? locale : 'sv'
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cvzume.com'
  const first = typeof firstName === 'string' ? firstName.trim().slice(0, 60) : ''
  const last = typeof lastName === 'string' ? lastName.trim().slice(0, 60) : ''

  const { data, error } = await serviceClient().auth.admin.generateLink({
    type: 'signup', email: email.trim().toLowerCase(), password,
    options: { data: { first_name: first, last_name: last }, redirectTo: `${site}/${loc}/auth?mode=confirmed` },
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  const link = data.properties?.action_link
  if (!link || !(await sendConfirmEmail(email.trim(), link, loc, first))) {
    return NextResponse.json({ error: 'email_failed' }, { status: 502 })
  }
  return NextResponse.json({ user: { id: data.user?.id } }, { status: 200 })
}
