// Sıfırlama linkinden gelen erişim anahtarıyla yeni şifreyi kaydeder (anahtar doğrulanır, şifre sunucuda yazılır).
import { NextResponse } from 'next/server'
import { clientIp, getRequestUser, rateLimit, serviceClient } from '@/lib/server-auth'

function isRecoverySession(request: Request): boolean {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || ''
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
    const amr = Array.isArray(payload.amr) ? payload.amr as { method?: string; timestamp?: number }[] : []
    return amr.some(a => ['recovery', 'otp', 'magiclink'].includes(a.method || '') && Date.now() / 1000 - (a.timestamp || 0) < 3600)
  } catch { return false }
}

export async function POST(request: Request) {
  if (!rateLimit(`reset:${clientIp(request)}`, 10)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const user = await getRequestUser(request)
  if (!user) return NextResponse.json({ error: 'expired' }, { status: 401 })
  // Sadece e-postadaki sıfırlama linkinden gelen oturum kabul edilir (amr: recovery/otp, son 1 saat).
  // Normal bir oturum anahtarı (çalınmış olsa bile) mevcut şifreyi bilmeden şifre değiştiremez.
  if (!isRecoverySession(request)) return NextResponse.json({ error: 'expired' }, { status: 401 })
  const { password } = await request.json().catch(() => ({}))
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) return NextResponse.json({ error: 'short' }, { status: 400 })
  const { error } = await serviceClient().auth.admin.updateUserById(user.id, { password })
  if (error) {
    console.error('reset password', error.message)
    return NextResponse.json({ error: /weak|pwned|leaked/i.test(error.message) ? 'weak' : 'failed' }, { status: 400 })
  }
  return NextResponse.json({ ok: true })
}
