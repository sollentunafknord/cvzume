// src/app/api/stripe/checkout/route.ts
import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/server-auth'

const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!)
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cvzume.com'

export async function POST(request: Request) {
  // Abonelik her zaman giriş yapmış kullanıcının kendi e-postasına açılır
  const user = await getRequestUser(request)
  const email = user?.email
  if (!email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { yearly } = await request.json().catch(() => ({ yearly: false }))
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
