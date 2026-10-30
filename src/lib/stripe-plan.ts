// Stripe'ta bu e-postanın aktif aboneliği var mı? Checkout customer_email ile çalıştığı için Stripe
// her ödemede aynı e-postaya yeni bir müşteri açabiliyor; sadece ilkine bakmak Pro'yu 'free' gösteriyordu.
import Stripe from 'stripe'

export const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!)

const PRO_STATUSES = new Set(['active', 'trialing', 'past_due'])

export async function findActiveSubscription(email: string): Promise<{ sub: Stripe.Subscription; customer: Stripe.Customer } | null> {
  const stripe = getStripe()
  const customers = await stripe.customers.list({ email, limit: 20 })
  for (const c of customers.data) {
    const subs = await stripe.subscriptions.list({ customer: c.id, status: 'all', limit: 10, expand: ['data.items.data.price'] })
    const found = subs.data.find(s => PRO_STATUSES.has(s.status))
    if (found) return { sub: found, customer: c }
  }
  return null
}

export async function hasActiveSubscription(email: string): Promise<boolean> {
  return !!(await findActiveSubscription(email))
}
