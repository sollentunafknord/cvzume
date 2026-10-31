import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { isAdminEmail } from '@/lib/admin'
import { serviceClient } from '@/lib/server-auth'
import { sendResetEmail } from '@/lib/reset-email'


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
    return isAdminEmail(user?.email)
  } catch { return false }
}

export async function POST(req: Request) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  // Link Supabase'ten, e-posta bizden (noreply@cvzume.com) — bkz. src/lib/reset-email.ts
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cvzume.com'
  const { data, error } = await serviceClient().auth.admin.generateLink({ type: 'recovery', email, options: { redirectTo: `${site}/sv/auth?mode=reset` } })
  if (!error && data?.properties?.action_link && !(await sendResetEmail(email, data.properties.action_link, 'sv'))) {
    return NextResponse.json({ error: 'email_failed' }, { status: 500 })
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
