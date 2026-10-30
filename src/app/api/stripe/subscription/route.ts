import { NextResponse } from 'next/server'
import { isAdminEmail } from '@/lib/admin'
import { getRequestUser, hasProOverride } from '@/lib/server-auth'
import { findActiveSubscription } from '@/lib/stripe-plan'

// Sadece giriş yapmış kullanıcının kendi planı. Eskiden ?email= ile herkesin abonelik bilgisi
// (müşteri/abonelik kimlikleri dahil) sorgulanabiliyordu.
export async function GET(request: Request) {
  const user = await getRequestUser(request)
  if (!user?.email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const email = user.email

  // Admin her zaman Pro (tüm özellikleri test edebilsin)
  if (isAdminEmail(email)) {
    return NextResponse.json({ plan: 'pro', interval: 'yearly', override: true, admin: true })
  }

  // Manual pro override takes precedence over Stripe
  if (await hasProOverride(user.id)) {
    return NextResponse.json({ plan: 'pro', interval: 'yearly', override: true })
  }

  try {
    const found = await findActiveSubscription(email)
    if (!found) {
      return NextResponse.json({ plan: 'free' })
    }
    const { sub, customer } = found

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
