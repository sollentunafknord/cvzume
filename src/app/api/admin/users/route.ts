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

export async function GET(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, is_pro_override')
    .eq('is_pro_override', true)

  const proOverrideIds = new Set((profiles || []).map(p => p.id))

  const result = users.map(u => ({
    id: u.id,
    email: u.email,
    firstName: u.user_metadata?.first_name || u.user_metadata?.firstName || '',
    lastName: u.user_metadata?.last_name || u.user_metadata?.lastName || '',
    createdAt: u.created_at,
    lastSignIn: u.last_sign_in_at,
    emailConfirmed: !!u.email_confirmed_at,
    isPro: proOverrideIds.has(u.id),
  }))

  return NextResponse.json({ users: result })
}
