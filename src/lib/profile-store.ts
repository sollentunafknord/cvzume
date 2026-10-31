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

// ── CV fotoğrafı ──
// profiles.cv_photo_url: '' = profil resmini kullan, 'none' = CV'de fotoğraf yok, URL = ayrı CV fotoğrafı.
// Profil resmi profiles.avatar_url'de (yerel kopya cvita_avatar). Profil satırı dil başına ayrı olduğu
// için ikisi de kullanıcının herhangi bir satırında olabilir.
export const CV_PHOTO_NONE = 'none'

export function resolveCvPhoto(choice: string, avatar: string): string {
  if (choice === CV_PHOTO_NONE) return ''
  return choice || avatar || ''
}

export async function loadPhotoSettings(): Promise<{ avatar: string; choice: string }> {
  let avatar = localStorage.getItem('cvita_avatar') || ''
  let choice = localStorage.getItem('cvita_cv_photo') || ''
  const { token, user } = session()
  if (token && user.id) {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles?id=eq.${user.id}&select=*`, {
        headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: 'Bearer ' + token },
      })
      const rows = await res.json()
      if (Array.isArray(rows) && rows.length) {
        avatar = rows.find(r => r.avatar_url)?.avatar_url || avatar
        choice = rows.find(r => r.cv_photo_url)?.cv_photo_url || ''
        localStorage.setItem('cvita_avatar', avatar)
        localStorage.setItem('cvita_cv_photo', choice)
      }
    } catch { /* çevrimdışı: yerel kopya */ }
  }
  return { avatar, choice }
}

export async function loadCvPhoto(): Promise<string> {
  const { avatar, choice } = await loadPhotoSettings()
  return resolveCvPhoto(choice, avatar)
}

/** Resmi avatars kovasına yükler, herkese açık URL'ini döner. */
export async function uploadPhoto(file: File, prefix = 'avatar'): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const path = `${prefix}_${Date.now()}.${(file.name.split('.').pop() || 'jpg').toLowerCase()}`
  const res = await fetch(`${url}/storage/v1/object/avatars/${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': file.type, 'x-upsert': 'true', apikey: key },
    body: file,
  })
  if (!res.ok) throw new Error('upload_failed')
  return `${url}/storage/v1/object/public/avatars/${path}`
}

/** CV fotoğrafı seçimini kullanıcının tüm profil satırlarına yazar (yoksa bu dil için satır açar). */
export async function saveCvPhotoChoice(choice: string, locale: string): Promise<boolean> {
  localStorage.setItem('cvita_cv_photo', choice)
  const { token, user } = session()
  if (!token || !user.id) return false
  const base = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/profiles`
  const headers = { 'Content-Type': 'application/json', apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: 'Bearer ' + token }
  try {
    const res = await fetch(`${base}?id=eq.${user.id}`, {
      method: 'PATCH', headers: { ...headers, Prefer: 'return=representation' }, body: JSON.stringify({ cv_photo_url: choice }),
    })
    if (!res.ok) return false
    const rows = await res.json()
    if (Array.isArray(rows) && rows.length) return true
    const ins = await fetch(base, {
      method: 'POST', headers: { ...headers, Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ id: user.id, locale, cv_photo_url: choice, updated_at: new Date().toISOString() }),
    })
    return ins.ok
  } catch {
    return false
  }
}
