// Stripe'ta bu e-postanın aktif aboneliği var mı? Checkout customer_email ile çalıştığı için Stripe
// her ödemede aynı e-postaya yeni bir müşteri açabiliyor; sadece ilkine bakmak Pro'yu 'free' gösteriyordu.
import Stripe from 'stripe'

// Canlı ödeme: sadece canlı sitede (VERCEL_ENV=production) ve STRIPE_LIVE_SECRET_KEY tanımlıysa.
// Önizleme ve yerel geliştirme test anahtarlarıyla (STRIPE_SECRET_KEY) çalışmaya devam eder.
export const stripeLive = () => process.env.VERCEL_ENV === 'production' && !!process.env.STRIPE_LIVE_SECRET_KEY
export const getStripe = () => new Stripe((stripeLive() ? process.env.STRIPE_LIVE_SECRET_KEY : process.env.STRIPE_SECRET_KEY)!)

// Canlı fiyatlar (gizli değil): CVzume Pro, prod_VXqzYaZ3qpvZcB
const LIVE_PRICES = { monthly: 'price_1UWlHRGnK5c1KgO9lQJFbPgF', yearly: 'price_1UWlHSGnK5c1KgO9ct1koSx2' }
export function priceId(yearly: boolean): string {
  if (stripeLive()) return yearly ? LIVE_PRICES.yearly : LIVE_PRICES.monthly
  return (yearly && process.env.STRIPE_YEARLY_PRICE_ID) ? process.env.STRIPE_YEARLY_PRICE_ID : process.env.STRIPE_PRICE_ID!
}

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
