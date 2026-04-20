import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_EMAIL = 'cyesil@gmail.com'

async function verifyAdmin(req: Request): Promise<boolean> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token) return false
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser(token)
    return user?.email === ADMIN_EMAIL
  } catch { return false }
}

export async function POST(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { userId, isPro } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Upsert for all existing locales of this user, or insert sv default
  const { data: existing } = await supabase
    .from('profiles')
    .select('id, locale')
    .eq('id', userId)

  if (existing && existing.length > 0) {
    await supabase
      .from('profiles')
      .update({ is_pro_override: isPro })
      .eq('id', userId)
  } else {
    await supabase
      .from('profiles')
      .insert({ id: userId, locale: 'sv', is_pro_override: isPro })
  }

  return NextResponse.json({ ok: true, isPro })
}
