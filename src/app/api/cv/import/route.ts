// CV içe aktarma: PDF veya Word (.docx) → metin → yapay zeka ile yapılandırılmış profil.
// Eski /api/cv/parse emekli bir modele bağlıydı ve hiçbir ekran onu çağırmıyordu; bu onun yerine geçer.
import { NextResponse } from 'next/server'
import { getRequestUser, rateLimit } from '@/lib/server-auth'
import { cleanCvText, extractCvText, MAX_BYTES, parseCvText } from '@/lib/cv-import'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  // Sadece giriş yapmış kullanıcılar (yapay zeka maliyeti)
  const user = await getRequestUser(request)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  if (!rateLimit(`cvimport:${user.id}`, 15)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  const form = await request.formData().catch(() => null)
  const file = form?.get('file')
  if (!(file instanceof File)) return NextResponse.json({ error: 'no_file' }, { status: 400 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: 'too_large' }, { status: 400 })
  if (/\.doc$/i.test(file.name)) return NextResponse.json({ error: 'old_doc' }, { status: 400 })

  let text = ''
  try {
    text = cleanCvText(await extractCvText(file.name, file.type, Buffer.from(await file.arrayBuffer())))
  } catch (e) {
    const code = e instanceof Error && e.message === 'unsupported' ? 'unsupported' : 'unreadable'
    if (code === 'unreadable') console.error('cv import: dosya okunamadı', file.name, file.type, file.size, e)
    return NextResponse.json({ error: code }, { status: 400 })
  }
  // Taranmış (resim) PDF'te metin katmanı yok
  if (text.length < 100) return NextResponse.json({ error: 'no_text' }, { status: 422 })

  try {
    const profile = await parseCvText(text)
    return NextResponse.json({ profile })
  } catch (err) {
    console.error('cv import AI failed', err)
    return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
  }
}
