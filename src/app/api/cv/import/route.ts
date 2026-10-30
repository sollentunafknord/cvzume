// CV içe aktarma: PDF veya Word (.docx) → metin → yapay zeka ile yapılandırılmış profil.
// Eski /api/cv/parse emekli bir modele bağlıydı ve hiçbir ekran onu çağırmıyordu; bu onun yerine geçer.
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cleanCvText, extractCvText, MAX_BYTES, parseCvText } from '@/lib/cv-import'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: Request) {
  // Sadece giriş yapmış kullanıcılar (yapay zeka maliyeti)
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { auth: { persistSession: false } })
  const { data: { user } } = await supabase.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

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
