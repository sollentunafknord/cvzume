import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
    firstName: user.user_metadata?.first_name || '',
    lastName: user.user_metadata?.last_name || '',
  }, { status: 200 })
}
