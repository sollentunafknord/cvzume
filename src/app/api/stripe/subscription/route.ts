import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!)

async function checkProOverride(email: string): Promise<boolean> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: users } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const user = users?.users?.find(u => u.email === email)
    if (!user) return false
    const { data } = await supabase
      .from('profiles')
      .select('is_pro_override')
      .eq('id', user.id)
      .eq('is_pro_override', true)
      .limit(1)
    return !!(data && data.length > 0)
  } catch { return false }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email krävs' }, { status: 400 })
  }

  // Manual pro override takes precedence over Stripe
  const isOverride = await checkProOverride(email)
  if (isOverride) {
    return NextResponse.json({ plan: 'pro', interval: 'yearly', override: true })
  }

  try {
    // Checkout customer_email ile çalıştığı için Stripe her ödemede aynı e-postaya yeni bir müşteri
    // açabiliyor; sadece ilkine bakmak Pro kullanıcıyı 'free' gösteriyordu. Hepsine bak.
    const customers = await getStripe().customers.list({ email, limit: 20 })

    if (customers.data.length === 0) {
      return NextResponse.json({ plan: 'free' })
    }

    const PRO_STATUSES = new Set(['active', 'trialing', 'past_due'])
    let sub: Stripe.Subscription | null = null
    let customer = customers.data[0]
    for (const c of customers.data) {
      const subs = await getStripe().subscriptions.list({
        customer: c.id,
        status: 'all',
        limit: 10,
        expand: ['data.items.data.price'],
      })
      const found = subs.data.find(s => PRO_STATUSES.has(s.status))
      if (found) { sub = found; customer = c; break }
    }

    if (!sub) {
      return NextResponse.json({ plan: 'free' })
    }

    const subAny = sub as any

    // Yeni Stripe API sürümlerinde dönem sonu abonelik kalemlerinde (items.data[].current_period_end);
    // billing_cycle_anchor başlangıç anı, yenileme tarihi değil.
    let periodEndTs = subAny.current_period_end
      || (sub.items.data[0] as unknown as { current_period_end?: number })?.current_period_end
      || subAny.billing_cycle_anchor
      || null

    let periodEndISO = null
    if (periodEndTs && typeof periodEndTs === 'number') {
      periodEndISO = new Date(periodEndTs * 1000).toISOString()
    } else if (periodEndTs && typeof periodEndTs === 'string') {
      periodEndISO = new Date(periodEndTs).toISOString()
    }

    const item = sub.items.data[0]
    const interval = item.price.recurring?.interval

    return NextResponse.json({
      plan: 'pro',
      interval: interval === 'year' ? 'yearly' : 'monthly',
      currentPeriodEnd: periodEndISO,
      cancelAtPeriodEnd: subAny.cancel_at_period_end || false,
      subscriptionId: sub.id,
      customerId: customer.id,
    })

  } catch (error: any) {
    console.error('Stripe subscription error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
