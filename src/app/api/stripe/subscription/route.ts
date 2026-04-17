import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email')

  if (!email) {
    return NextResponse.json({ error: 'Email krävs' }, { status: 400 })
  }

  try {
    const customers = await stripe.customers.list({ email, limit: 1 })

    if (customers.data.length === 0) {
      return NextResponse.json({ plan: 'free' })
    }

    const customer = customers.data[0]

    const subscriptions = await stripe.subscriptions.list({
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
    
    // current_period_end can be in different places depending on Stripe version
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
