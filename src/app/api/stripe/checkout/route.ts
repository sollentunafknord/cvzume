// src/app/api/stripe/checkout/route.ts
import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cvzume.com'

export async function POST(request: Request) {
  const { email, yearly } = await request.json()
  if (!email) {
    return NextResponse.json({ error: 'Email krävs' }, { status: 400 })
  }
  try {
    const priceId = yearly && process.env.STRIPE_YEARLY_PRICE_ID
      ? process.env.STRIPE_YEARLY_PRICE_ID
      : process.env.STRIPE_PRICE_ID!

    const session = await getStripe().checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${SITE_URL}/sv/dashboard?upgraded=true`,
      cancel_url: `${SITE_URL}/sv/upgrade`,
      metadata: { email },
    })
    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
