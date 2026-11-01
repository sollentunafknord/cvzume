// Google Analytics (GA4) — sadece ziyaretçi onay verirse yüklenir. Kimlik boşsa onay çubuğu da gösterilmez.
// Vercel Web Analytics çerezsiz olduğu için onaydan bağımsız çalışmaya devam eder.
// Ölçüm Kimliği gizli değil (her ziyaretçinin tarayıcısına gider). Sadece gerçek sitede ve Vercel önizlemelerinde
// çalışır; yerel geliştirme/testler istatistiklere karışmaz (bkz. gaAllowedHere).
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID || 'G-E9M4LF3KLL'
export const gaAllowedHere = () => typeof window !== 'undefined' && /(^|\.)cvzume\.com$|\.vercel\.app$/.test(window.location.hostname)
export const CONSENT_KEY = 'cvz_consent' // 'granted' | 'denied'
export const OPEN_CONSENT_EVENT = 'cvz-open-consent'

type W = Window & { dataLayer?: unknown[]; gtag?: (...a: unknown[]) => void }

export function readConsent(): 'granted' | 'denied' | '' {
  try { const v = localStorage.getItem(CONSENT_KEY); return v === 'granted' || v === 'denied' ? v : '' } catch { return '' }
}

export function loadGoogleAnalytics() {
  if (!GA_ID || !gaAllowedHere() || document.getElementById('ga4-src')) return
  const w = window as W
  w.dataLayer = w.dataLayer || []
  w.gtag = function gtag() { (w.dataLayer as unknown[]).push(arguments) } // eslint-disable-line prefer-rest-params
  w.gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted' })
  w.gtag('js', new Date())
  w.gtag('config', GA_ID, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false })
  const s = document.createElement('script')
  s.id = 'ga4-src'; s.async = true
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(s)
}

/** Onayı geri çekince GA çerezlerini sil (sayfa yenilenince GA da yüklenmez). */
export function clearGoogleAnalyticsCookies() {
  const host = location.hostname.replace(/^www\./, '')
  for (const c of document.cookie.split(';')) {
    const name = c.split('=')[0].trim()
    if (name.startsWith('_ga')) for (const d of ['', `; domain=.${host}`, `; domain=${location.hostname}`]) document.cookie = `${name}=; Max-Age=0; path=/${d}`
  }
}
