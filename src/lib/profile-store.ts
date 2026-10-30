// Profil (CV verisi) okuma/kaydetme — client tarafı. Kaynak: profiles tablosu (id+locale), yerel kopya
// localStorage `cvita_profile_${locale}`. ProfileClient ve "Ny ansökan" akışı aynı yolu kullanır.
import type { Profile } from '@/app/[locale]/(app)/profile/types'

export type { Profile }

export const EMPTY_PROFILE: Profile = { phone: '', location: '', title: '', summary: '', experiences: [], educations: [], skills: [], languages: [] }

export function hasCvContent(p: Partial<Profile> | null | undefined): boolean {
  return !!p && ((p.experiences?.length ?? 0) > 0 || (p.summary?.trim().length ?? 0) > 20 || (p.skills?.length ?? 0) > 2)
}

function session() {
  const token = localStorage.getItem('cvita_token')
  const user = JSON.parse(localStorage.getItem('cvita_user') || '{}') as { id?: string; firstName?: string; lastName?: string; email?: string }
  return { token, user }
}

export async function loadProfile(locale: string): Promise<Profile> {
  const local = localStorage.getItem(`cvita_profile_${locale}`)
  if (local) {
    try { return { ...EMPTY_PROFILE, ...JSON.parse(local) } } catch { /* bozuk yerel kopya */ }
  }
  const { token, user } = session()
  if (!token || !user.id) return EMPTY_PROFILE
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&locale=eq.${locale}&select=*`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: 'Bearer ' + token },
    })
    const rows = await res.json()
    if (!Array.isArray(rows) || !rows[0]) return EMPTY_PROFILE
    const r = rows[0]
    const p: Profile = {
      phone: r.phone || '', location: r.location || '', title: r.title || '', summary: r.summary || '',
      experiences: r.experiences || [], educations: r.educations || [], skills: r.skills || [], languages: r.languages || [],
    }
    localStorage.setItem(`cvita_profile_${locale}`, JSON.stringify(p))
    return p
  } catch {
    return EMPTY_PROFILE
  }
}

// İçe aktarılan CV'den gelen ad/soyad boş değilse kullanıcıya da yazılır.
export async function saveProfile(locale: string, p: Profile, names?: { firstName?: string; lastName?: string }): Promise<boolean> {
  localStorage.setItem(`cvita_profile_${locale}`, JSON.stringify(p))
  const { token, user } = session()
  if (names?.firstName) user.firstName = names.firstName
  if (names?.lastName) user.lastName = names.lastName
  localStorage.setItem('cvita_user', JSON.stringify(user))
  window.dispatchEvent(new Event('cvita_profile_updated'))
  if (!token || !user.id) return false
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: 'Bearer ' + token, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ id: user.id, locale, ...p, updated_at: new Date().toISOString() }),
    })
    return res.ok
  } catch {
    return false
  }
}
