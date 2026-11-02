// Admin → İndirim kodları. Kodlar Stripe'ta tutulur (kupon + promosyon kodu); ödeme sayfası
// allow_promotion_codes ile kod alanını zaten gösteriyor. Canlıda canlı Stripe, önizlemede test Stripe.
// Oran değiştirmek = eski kodu kapatıp aynı adla yeni kupon/kod açmak (Stripe kupon oranı sonradan değişmez).
import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { isAdminEmail } from '@/lib/admin'
import { getRequestUser } from '@/lib/server-auth'
import { getStripe } from '@/lib/stripe-plan'

type Duration = 'once' | 'repeating' | 'forever'
type Body = { code?: string; percent?: number; duration?: Duration; months?: number; expiresAt?: string; maxRedemptions?: number | null }

async function admin(request: Request) {
  const me = await getRequestUser(request)
  return !!me && isAdminEmail(me.email)
}

function view(p: Stripe.PromotionCode) {
  const c = (p.promotion?.coupon ?? null) as Stripe.Coupon | null
  return {
    id: p.id, code: p.code, active: p.active,
    percent: c?.percent_off ?? null, duration: c?.duration ?? null, months: c?.duration_in_months ?? null,
    expiresAt: p.expires_at ? new Date(p.expires_at * 1000).toISOString() : null, expired: !!p.expires_at && p.expires_at * 1000 < Date.now(),
    maxRedemptions: p.max_redemptions, redeemed: p.times_redeemed, created: new Date(p.created * 1000).toISOString(),
  }
}

async function create(stripe: Stripe, b: Body) {
  const code = (b.code || '').trim().toUpperCase()
  const percent = Number(b.percent)
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) throw new Error('Kod 3–30 karakter olmalı: harf, rakam, - ve _')
  if (!(percent >= 1 && percent <= 100)) throw new Error('Oran 1 ile 100 arasında olmalı')
  const duration: Duration = b.duration === 'forever' || b.duration === 'repeating' ? b.duration : 'once'
  const months = Math.round(Number(b.months) || 0)
  if (duration === 'repeating' && !(months >= 1 && months <= 36)) throw new Error('Ay sayısı 1–36 olmalı')
  // Bitiş: seçilen günün sonu (İsveç saatiyle yaklaşık), geçmiş tarih olamaz
  let expires: number | undefined
  if (b.expiresAt) {
    expires = Math.floor(new Date(`${b.expiresAt}T23:59:59+01:00`).getTime() / 1000)
    if (!(expires > Date.now() / 1000)) throw new Error('Bitiş tarihi gelecekte olmalı')
  }
  const max = b.maxRedemptions ? Math.round(Number(b.maxRedemptions)) : undefined
  const coupon = await stripe.coupons.create({
    percent_off: percent, duration, ...(duration === 'repeating' ? { duration_in_months: months } : {}),
    name: `${code} (%${percent})`, ...(expires ? { redeem_by: expires } : {}),
  })
  const promo = await stripe.promotionCodes.create({
    promotion: { type: 'coupon', coupon: coupon.id }, code,
    ...(expires ? { expires_at: expires } : {}), ...(max && max > 0 ? { max_redemptions: max } : {}),
    expand: ['promotion.coupon'],
  })
  return view(promo)
}

export async function GET(request: Request) {
  if (!(await admin(request))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  try {
    const list = await getStripe().promotionCodes.list({ limit: 50, expand: ['data.promotion.coupon'] })
    return NextResponse.json({ codes: list.data.map(view) })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'stripe' }, { status: 502 })
  }
}

export async function POST(request: Request) {
  if (!(await admin(request))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const b = (await request.json().catch(() => ({}))) as Body
  try {
    return NextResponse.json({ code: await create(getStripe(), b) })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'stripe' }, { status: 400 })
  }
}

// { id, active: false } → kodu kapat. { id, percent } → eskisini kapat, aynı kod ve ayarlarla yeni oranı aç.
export async function PATCH(request: Request) {
  if (!(await admin(request))) return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  const b = (await request.json().catch(() => ({}))) as { id?: string; active?: boolean; percent?: number }
  if (!b.id?.startsWith('promo_')) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const stripe = getStripe()
  try {
    const old = view(await stripe.promotionCodes.retrieve(b.id, { expand: ['promotion.coupon'] }))
    if (b.percent === undefined) {
      await stripe.promotionCodes.update(b.id, { active: b.active === true })
      return NextResponse.json({ ok: true })
    }
    await stripe.promotionCodes.update(b.id, { active: false })
    const next = await create(stripe, {
      code: old.code, percent: b.percent, duration: (old.duration as Duration) || 'once', months: old.months ?? undefined,
      expiresAt: old.expiresAt ? old.expiresAt.slice(0, 10) : undefined,
      maxRedemptions: old.maxRedemptions ? Math.max(1, old.maxRedemptions - old.redeemed) : null,
    }).catch(async e => { await stripe.promotionCodes.update(b.id!, { active: true }); throw e })
    return NextResponse.json({ code: next })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'stripe' }, { status: 400 })
  }
}
