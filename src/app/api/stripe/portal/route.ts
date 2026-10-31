// Stripe kundportal: kullanıcı aboneliğini kendisi iptal eder, kartını değiştirir, faturalarını görür.
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe-plan'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'


// Portal, hesapta varsayılan bir konfigürasyon ister. Yoksa (yeni hesap / test modu)
// burada bir kez oluşturuyoruz; sonraki çağrılar mevcut olanı kullanır.
async function ensurePortalConfig(stripe: Stripe): Promise<string | undefined> {
  const existing = await stripe.billingPortal.configurations.list({ is_default: true, limit: 1 })
  if (existing.data.length > 0) return undefined
  const created = await stripe.billingPortal.configurations.create({
    business_profile: {
      headline: 'CVzume — hantera din prenumeration',
      privacy_policy_url: 'https://www.cvzume.com/sv/legal/privacy',
      terms_of_service_url: 'https://www.cvzume.com/sv/legal/terms',
    },
    features: {
      subscription_cancel: { enabled: true, mode: 'at_period_end' },
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      customer_update: { enabled: true, allowed_updates: ['email', 'address'] },
    },
  })
  return created.id
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const token = authHeader.replace('Bearer ', '')

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  )
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user?.email) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
  }

  const { locale } = await request.json().catch(() => ({ locale: 'sv' }))
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cvzume.com'

  try {
    const stripe = getStripe()
    const customers = await stripe.customers.list({ email: user.email, limit: 1 })
    if (customers.data.length === 0) {
      return NextResponse.json({ error: 'no_customer' }, { status: 404 })
    }

    const configuration = await ensurePortalConfig(stripe)
    const session = await stripe.billingPortal.sessions.create({
      customer: customers.data[0].id,
      return_url: `${origin}/${locale || 'sv'}/settings`,
      ...(configuration ? { configuration } : {}),
    })
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe portal error:', err)
    return NextResponse.json({ error: 'portal_failed' }, { status: 500 })
  }
}
