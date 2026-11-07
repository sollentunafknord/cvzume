import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function nameOf(m: Record<string, unknown>) {
  const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '')
  if (s(m.first_name)) return { firstName: s(m.first_name), lastName: s(m.last_name) }
  if (s(m.given_name)) return { firstName: s(m.given_name), lastName: s(m.family_name) }
  const full = s(m.full_name) || s(m.name)
  const i = full.indexOf(' ')
  return i > 0 ? { firstName: full.slice(0, i), lastName: full.slice(i + 1) } : { firstName: full, lastName: '' }
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Config error' }, { status: 500 })
  }

  const { access_token } = await request.json()
  if (!access_token) {
    return NextResponse.json({ error: 'Token gerekli' }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { data: { user }, error } = await supabase.auth.getUser(access_token)

  if (error || !user) {
    return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 })
  }

  return NextResponse.json({
    id: user.id,
    email: user.email,
    // E-postayla kayıtta first_name/last_name; Google/Facebook'ta given_name/family_name ya da full_name gelir
    ...nameOf(user.user_metadata ?? {}),
  }, { status: 200 })
}
