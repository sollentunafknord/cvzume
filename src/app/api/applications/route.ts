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

  const { access_token, role, jobAd, matchScore, cvSummary, coverLetter, keyRequirements, tips, provider, status, employer, tailoredCv } = await request.json()
  if (!access_token) return NextResponse.json({ error: 'Token required' }, { status: 401 })

  const supabase = getSupabaseWithToken(supabaseUrl, supabaseKey, access_token)
  const { data: { user }, error: authError } = await supabase.auth.getUser(access_token)
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const row: Record<string, unknown> = {
    user_id: user.id,
    role,
    job_ad: jobAd,
    match_score: matchScore,
    cv_summary: cvSummary,
    cover_letter: coverLetter,
    key_requirements: keyRequirements,
    tips,
    provider,
    status: status || 'draft',
    ...(employer ? { employer } : {}),
    ...(tailoredCv ? { tailored_cv: tailoredCv } : {}),
  }
  let { data, error } = await supabase.from('applications').insert(row).select().single()
  // tailored_cv kolonu henüz eklenmemişse (supabase/migrations/20261030_applications_tailored_cv.sql) onsuz kaydet
  if (error && 'tailored_cv' in row && /tailored_cv/.test(error.message)) {
    delete row.tailored_cv
    ;({ data, error } = await supabase.from('applications').insert(row).select().single())
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ application: data }, { status: 200 })
}

export async function GET(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return NextResponse.json({ error: 'Config error' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const access_token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || searchParams.get('token')
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

  const { id, status, coverLetter, cvSummary, tailoredCv } = await request.json()
  if (!id || (!status && coverLetter === undefined && cvSummary === undefined && tailoredCv === undefined)) {
    return NextResponse.json({ error: 'id and a field to update required' }, { status: 400 })
  }

  const supabase = getSupabaseWithToken(supabaseUrl, supabaseKey, token)
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const patch: Record<string, unknown> = {}
  if (status) patch.status = status
  if (typeof coverLetter === 'string') patch.cover_letter = coverLetter
  if (typeof cvSummary === 'string') patch.cv_summary = cvSummary
  if (tailoredCv) patch.tailored_cv = tailoredCv
  let { error } = await supabase.from('applications').update(patch).eq('id', id).eq('user_id', user.id)
  if (error && 'tailored_cv' in patch && /tailored_cv/.test(error.message)) {
    delete patch.tailored_cv
    if (Object.keys(patch).length) ({ error } = await supabase.from('applications').update(patch).eq('id', id).eq('user_id', user.id))
    else error = null
  }

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
