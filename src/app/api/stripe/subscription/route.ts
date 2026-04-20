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
    const { data: users } = await supabase.auth.admin.listUsers()
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
    const customers = await getStripe().customers.list({ email, limit: 1 })

    if (customers.data.length === 0) {
      return NextResponse.json({ plan: 'free' })
    }

    const customer = customers.data[0]

    const subscriptions = await getStripe().subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
      expand: ['data.items.data.price'],
    })

    if (subscriptions.data.length === 0) {
      return NextResponse.json({ plan: 'free' })
    }

    const sub = subscriptions.data[0]
    const subAny = sub as any

    let periodEndTs = subAny.current_period_end
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
