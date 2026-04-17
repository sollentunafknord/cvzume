// src/app/api/stripe/webhook/route.ts
import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cvzume.com'

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      // Pro abonelik başladı
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const email = session.metadata?.email || session.customer_email
        if (!email) break

        // Abonelik detaylarını al
        const subscriptionId = session.subscription as string
        const subscription = await stripe.subscriptions.retrieve(subscriptionId) as Stripe.Subscription
        const interval = subscription.items.data[0]?.plan?.interval
        const plan = interval === 'year' ? 'yearly' : 'monthly'
        const periodEnd = (subscription as any).current_period_end ?? subscription.items.data[0]?.current_period_end
        const nextBillingDate = periodEnd ? new Date(periodEnd * 1000).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'

        // Müşterinin ismini al
        const customer = await stripe.customers.retrieve(session.customer as string) as Stripe.Customer
        const firstName = customer.name?.split(' ')[0] || ''

        // Pro onay emaili gönder
        await fetch(`${SITE_URL}/api/email/subscription-confirmed`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, firstName, plan, nextBillingDate })
        })
        break
      }

      // Abonelik iptal edildi
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer
        const email = customer.email
        if (!email) break

        const firstName = customer.name?.split(' ')[0] || ''
        const periodEnd2 = (subscription as any).current_period_end ?? subscription.items.data[0]?.current_period_end
        const accessUntil = periodEnd2 ? new Date(periodEnd2 * 1000).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'

        // İptal emaili gönder
        await fetch(`${SITE_URL}/api/email/subscription-cancelled`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, firstName, accessUntil })
        })
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }
  } catch (e: any) {
    console.error('Webhook handler error:', e)
  }

  return NextResponse.json({ received: true })
}
