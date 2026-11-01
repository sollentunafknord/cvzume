// Tarayıcı tarafı: geçerli Supabase erişim anahtarı (gerekirse refresh) ve yetkili fetch.
// Anahtar 1 saatte doluyor; eskiden çoğu sayfa yenilemeden süresi geçmiş anahtarla istek atıyordu.

export async function getValidToken(): Promise<string | null> {
  const token = localStorage.getItem('cvita_token')
  const expiry = Number(localStorage.getItem('cvita_token_expiry') || 0)
  if (!token) return null
  if (Date.now() < expiry - 60000) return token
  return (await refreshToken()) ?? token
}

async function refreshToken(): Promise<string | null> {
  const refresh = localStorage.getItem('cvita_refresh_token')
  if (!refresh) return null
  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refresh }),
    })
    if (!res.ok) return null
    const data = await res.json()
    if (!data.access_token) return null
    localStorage.setItem('cvita_token', data.access_token)
    localStorage.setItem('cvita_token_expiry', String(Date.now() + data.expires_in * 1000))
    if (data.refresh_token) localStorage.setItem('cvita_refresh_token', data.refresh_token)
    return data.access_token
  } catch {
    return null
  }
}

/** fetch + Authorization: Bearer. 401 gelirse anahtarı bir kez yenileyip tekrar dener. */
export async function authFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const send = (token: string | null) => fetch(url, {
    ...init,
    headers: { ...(init.headers as Record<string, string>), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  const res = await send(await getValidToken())
  if (res.status !== 401) return res
  const fresh = await refreshToken()
  return fresh ? send(fresh) : res
}

/** Çıkış: oturum ve bu tarayıcıda tutulan kişisel veriler (CV, taslaklar) silinir — ortak bilgisayarda kalmasın. */
export function signOut() {
  try {
    for (const k of Object.keys(localStorage)) if (k.startsWith('cvita_') || k.startsWith('cvzume_')) localStorage.removeItem(k)
    sessionStorage.clear()
  } catch { /* yok */ }
}

/** Uygulama açıkken erişim anahtarını taze tutar: hemen ve 5 dakikada bir, süresi dolmak üzereyse yeniler.
 *  Anahtarı doğrudan localStorage'dan okuyan eski kodlar da (admin, başvuru güncelleme, profil) böylece çalışır. */
export function keepTokenFresh(): () => void {
  getValidToken().catch(() => {})
  const id = setInterval(() => { getValidToken().catch(() => {}) }, 5 * 60 * 1000)
  const onFocus = () => { getValidToken().catch(() => {}) }
  window.addEventListener('focus', onFocus)
  return () => { clearInterval(id); window.removeEventListener('focus', onFocus) }
}
