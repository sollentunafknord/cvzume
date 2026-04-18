import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getSupabaseWithToken(url: string, key: string, token: string) {
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${token}` }
    }
  })
}

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  const { access_token, role, jobAd, matchScore, cvSummary, coverLetter, keyRequirements, tips, provider } = await request.json()
  if (!access_token) return NextResponse.json({ error: 'Token required' }, { status: 401 })

  const supabase = getSupabaseWithToken(supabaseUrl, supabaseKey, access_token)
  const { data: { user }, error: authError } = await supabase.auth.getUser(access_token)
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { data, error } = await supabase.from('applications').insert({
    user_id: user.id,
    role,
    job_ad: jobAd,
    match_score: matchScore,
    cv_summary: cvSummary,
    cover_letter: coverLetter,
    key_requirements: keyRequirements,
    tips,
    provider,
    status: 'draft'
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ application: data }, { status: 200 })
}

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const access_token = searchParams.get('token')
  if (!access_token) return NextResponse.json({ error: 'Token required' }, { status: 401 })

  const supabase = getSupabaseWithToken(supabaseUrl, supabaseKey, access_token)
  const { data: { user }, error: authError } = await supabase.auth.getUser(access_token)
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { data, error } = await supabase.from('applications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ applications: data }, { status: 200 })
}

export async function PATCH(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 401 })

  const { id, status } = await request.json()
  if (!id || !status) return NextResponse.json({ error: 'id and status required' }, { status: 400 })

  const supabase = getSupabaseWithToken(supabaseUrl, supabaseKey, token)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { error } = await supabase.from('applications')
    .update({ status })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true }, { status: 200 })
}

export async function DELETE(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'Token required' }, { status: 401 })

  const { id } = await request.json()
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const supabase = getSupabaseWithToken(supabaseUrl, supabaseKey, token)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const { error } = await supabase.from('applications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true }, { status: 200 })
}
