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
    .from('job_favorites')
    .select('job_data')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ favorites: data?.map(r => r.job_data) || [] })
}

export async function POST(request: Request) {
  const { token, job } = await request.json()
  if (!token || !job) return NextResponse.json({ error: 'Token and job required' }, { status: 400 })

  const supabase = getSupabase(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { error } = await supabase
    .from('job_favorites')
    .upsert({ user_id: user.id, job_id: job.id, job_data: job }, { onConflict: 'user_id,job_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const { token, jobId } = await request.json()
  if (!token || !jobId) return NextResponse.json({ error: 'Token and jobId required' }, { status: 400 })

  const supabase = getSupabase(token)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { error } = await supabase
    .from('job_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('job_id', jobId)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
