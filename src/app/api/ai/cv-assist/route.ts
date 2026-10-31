// Rehberli akış (soru-cevapla CV) yardımcıları: bullets / skills / summary (src/lib/cv-assist.ts).
// Kotadan düşmez; giriş ve hız sınırı yeterli.
import { NextResponse } from 'next/server'
import { assistBullets, assistSkills, assistSummary } from '@/lib/cv-assist'
import { getRequestUser, rateLimit } from '@/lib/server-auth'

export const maxDuration = 60

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

export async function POST(request: Request) {
  const user = await getRequestUser(request)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!rateLimit(`assist:${user.id}`, 80)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const b = await request.json().catch(() => null) as Record<string, unknown> | null
  const locale = str(b?.locale) || 'sv'
  const mode = str(b?.mode)
  try {
    if (mode === 'bullets' && str(b?.text).length >= 5) return NextResponse.json({ bullets: await assistBullets(str(b?.text), str(b?.role), str(b?.company), locale) })
    if (mode === 'skills' && str(b?.target)) return NextResponse.json({ skills: await assistSkills(str(b?.target), str(b?.context), locale) })
    if (mode === 'summary' && str(b?.facts).length >= 20) return NextResponse.json({ summary: await assistSummary(str(b?.facts), locale) })
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  } catch (err) {
    console.error('cv-assist failed', mode, err)
    return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
  }
}
