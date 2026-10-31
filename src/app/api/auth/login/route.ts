import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { clientIp, rateLimit } from '@/lib/server-auth'

export async function POST(request: Request) {
  // Supabase'in IP başına sınırı Vercel'in IP'sini görür; saldırgana karşı fren burada
  if (!rateLimit(`login:${clientIp(request)}`, 20)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { email, password } = await request.json().catch(() => ({}))
  if (typeof email !== 'string' || typeof password !== 'string') return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  if (!rateLimit(`login:${email.trim().toLowerCase()}`, 10)) return NextResponse.json({ error: 'rate_limited' }, { status: 429 })

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ user: data.user, session: data.session }, { status: 200 })
}
