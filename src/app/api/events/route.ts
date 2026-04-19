import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabase(token: string) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } } }
  )
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 401 })

  const supabase = getSupabase(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { data, error } = await supabase
    .from('recent_events')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ events: data })
}

export async function POST(request: Request) {
  const { token, type, title, subtitle } = await request.json()
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 401 })

  const supabase = getSupabase(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  // Insert new event
  const { error: insertError } = await supabase
    .from('recent_events')
    .insert({ user_id: user.id, type, title, subtitle })

  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 })

  // Keep only latest 5 — delete the rest
  const { data: all } = await supabase
    .from('recent_events')
    .select('id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (all && all.length > 5) {
    const toDelete = all.slice(5).map((r: { id: string }) => r.id)
    await supabase.from('recent_events').delete().in('id', toDelete)
  }

  return NextResponse.json({ ok: true })
}
