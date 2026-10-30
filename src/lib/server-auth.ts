// Sunucu tarafı kimlik, Pro ve ücretsiz kota kontrolü. Eskiden Pro durumu ve kota tarayıcıda
// (localStorage + kullanıcının kendi yazabildiği usage_limits) tutuluyordu; artık karar burada.
import { createClient, type User } from '@supabase/supabase-js'
import { isAdminEmail } from './admin'
import { hasActiveSubscription } from './stripe-plan'

export const FREE_PER_MONTH = 2

export function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

/** Authorization: Bearer <token> başlığındaki Supabase kullanıcısı (yoksa/geçersizse null). */
export async function getRequestUser(request: Request): Promise<User | null> {
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  })
  const { data: { user } } = await supabase.auth.getUser(token).catch(() => ({ data: { user: null } }))
  return user
}

export async function hasProOverride(userId: string): Promise<boolean> {
  const { data } = await serviceClient().from('profiles').select('id').eq('id', userId).eq('is_pro_override', true).limit(1)
  return !!data?.length
}

export async function isProUser(user: User): Promise<boolean> {
  if (isAdminEmail(user.email)) return true
  if (await hasProOverride(user.id)) return true
  if (!user.email) return false
  return hasActiveSubscription(user.email).catch(() => false)
}

const thisMonth = () => new Date().toISOString().slice(0, 7) + '-01'

async function usedThisMonth(userId: string): Promise<number> {
  const { data } = await serviceClient().from('usage_limits').select('cv_count, reset_date').eq('user_id', userId).limit(1)
  const row = data?.[0]
  if (!row || (row.reset_date && String(row.reset_date).slice(0, 7) < thisMonth().slice(0, 7))) return 0
  return row.cv_count || 0
}

/** Yeni bir yapay zeka başvurusuna izin var mı? Pro sınırsız; ücretsiz planda ayda FREE_PER_MONTH. */
export async function checkCredit(user: User): Promise<{ allowed: boolean; pro: boolean }> {
  // Önce sayaç (ucuz): hakkı olan ücretsiz kullanıcı için Stripe'a hiç gitmeyiz
  if ((await usedThisMonth(user.id)) < FREE_PER_MONTH) return { allowed: true, pro: false }
  const pro = await isProUser(user)
  return { allowed: pro, pro }
}

/** Başarılı bir başvurudan sonra sayaç +1 (Pro'da sayılmaz). Yapay zeka hata verirse hak gitmez. */
export async function recordCredit(user: User): Promise<void> {
  const used = await usedThisMonth(user.id)
  await serviceClient().from('usage_limits').upsert(
    { user_id: user.id, cv_count: used + 1, reset_date: thisMonth() },
    { onConflict: 'user_id' },
  )
}

// Basit bellek içi fren (instance başına). Kötüye kullanıma karşı kaba bir sınır; kota yerine geçmez.
const hits = new Map<string, number[]>()
export function rateLimit(key: string, max: number, windowMs = 3600_000): boolean {
  const since = Date.now() - windowMs
  const list = (hits.get(key) ?? []).filter(t => t > since)
  if (list.length >= max) return false
  list.push(Date.now())
  hits.set(key, list)
  if (hits.size > 10_000) hits.clear()
  return true
}
