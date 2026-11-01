// src/app/api/stripe/checkout/route.ts
import { flowPath } from '@/lib/flow-path'
import { getStripe, priceId } from '@/lib/stripe-plan'
import { NextResponse } from 'next/server'
import { getRequestUser } from '@/lib/server-auth'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cvzume.com'
const LOCALES = ['sv', 'en', 'es', 'tr', 'de'] as const
type Locale = (typeof LOCALES)[number]
const SUBMIT_NOTE: Record<Locale, string> = {
  sv: 'Pro startar direkt efter betalningen och förnyas automatiskt tills du avslutar. Du har 14 dagars ångerrätt enligt våra villkor: www.cvzume.com/sv/legal/terms',
  en: 'Pro starts right after payment and renews automatically until you cancel. You have a 14-day right of withdrawal under our terms: www.cvzume.com/en/legal/terms',
  es: 'Pro empieza justo después del pago y se renueva automáticamente hasta que lo canceles. Tienes 14 días de desistimiento según nuestras condiciones: www.cvzume.com/es/legal/terms',
  tr: "Pro ödemeden hemen sonra başlar ve siz iptal edene kadar otomatik yenilenir. Koşullarımız gereği 14 günlük cayma hakkınız vardır: www.cvzume.com/tr/legal/terms",
  de: 'Pro startet direkt nach der Zahlung und verlängert sich automatisch, bis Sie kündigen. Sie haben ein 14-tägiges Widerrufsrecht gemäß unseren Bedingungen: www.cvzume.com/de/legal/terms',
}

export async function POST(request: Request) {
  // Abonelik her zaman giriş yapmış kullanıcının kendi e-postasına açılır
  const user = await getRequestUser(request)
  const email = user?.email
  if (!email) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const { yearly, locale } = await request.json().catch(() => ({ yearly: false, locale: 'sv' }))
  const loc = (LOCALES as readonly string[]).includes(locale) ? (locale as Locale) : 'sv'
  try {
    const stripe = getStripe()
    // Aynı e-postaya her ödemede yeni müşteri açılmasın: varsa mevcut müşteriyi kullan
    const existing = await stripe.customers.list({ email, limit: 1 })
    const customer = existing.data[0]?.id

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      ...(customer ? { customer } : { customer_email: email }),
      line_items: [{ price: priceId(!!yearly), quantity: 1 }],
      locale: loc,
      allow_promotion_codes: true,
      // Cayma hakkı: hizmet ödemeden hemen sonra başlar (koşullarda yazılı); ödeme düğmesinin altında kısa bilgi
      custom_text: { submit: { message: SUBMIT_NOTE[loc] } },
      success_url: `${SITE_URL}${flowPath(loc)}?upgraded=true`,
      cancel_url: `${SITE_URL}/${loc}/upgrade`,
      metadata: { email, locale: loc },
      subscription_data: { metadata: { email } },
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 })
  }
}
