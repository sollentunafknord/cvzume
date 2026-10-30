// Ücretsiz plan: ayda 2 yapay zeka başvurusu (usage_limits tablosu). Pro sınırsız.
// Sayaç burada artırılır; bağlantı hatasında kullanıcıyı engellemeyiz (eski davranış).
export const FREE_PER_MONTH = 2

export async function consumeApplicationCredit(): Promise<boolean> {
  if (localStorage.getItem('cvita_is_pro') === 'true') return true
  const token = localStorage.getItem('cvita_token')
  const user = JSON.parse(localStorage.getItem('cvita_user') || '{}')
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const thisMonth = new Date().toISOString().slice(0, 7) + '-01'
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/usage_limits?user_id=eq.${user.id}&select=*`, {
      headers: { apikey: supabaseKey, Authorization: 'Bearer ' + token },
    })
    const rows = await res.json()
    let cvCount = 0
    let resetDate = thisMonth
    if (Array.isArray(rows) && rows.length > 0) {
      const row = rows[0]
      if (row.reset_date && row.reset_date.slice(0, 7) < thisMonth.slice(0, 7)) {
        cvCount = 0; resetDate = thisMonth
      } else {
        cvCount = row.cv_count || 0; resetDate = row.reset_date || thisMonth
      }
    }
    if (cvCount >= FREE_PER_MONTH) return false
    await fetch(`${supabaseUrl}/rest/v1/usage_limits`, {
      method: 'POST',
      headers: { apikey: supabaseKey, Authorization: 'Bearer ' + token, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ user_id: user.id, cv_count: cvCount + 1, reset_date: resetDate }),
    })
    return true
  } catch {
    return true
  }
}
