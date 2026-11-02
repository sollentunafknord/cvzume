// Facebook sayfası ve Instagram'a gönderi (Meta Graph API). Anahtarlar Vercel'de:
// META_PAGE_ID, META_PAGE_TOKEN (süresiz sayfa anahtarı), META_IG_ID. Kurulum: scripts/setup-meta.sh
import { MARKER } from './posts'

const GRAPH = 'https://graph.facebook.com/v23.0'

export const metaConfigured = () => !!(process.env.META_PAGE_ID && process.env.META_PAGE_TOKEN)
// Forum İsveç: kullanıcının yönettiği ikinci sayfa (FORUM_PAGE_ID / FORUM_PAGE_TOKEN; setup-meta.sh ... FORUM)
export const forumConfigured = () => !!(process.env.FORUM_PAGE_ID && process.env.FORUM_PAGE_TOKEN)

type Page = { id: string; token: string }
const cvzumePage = (): Page => ({ id: process.env.META_PAGE_ID!, token: process.env.META_PAGE_TOKEN! })
const forumPage = (): Page => ({ id: process.env.FORUM_PAGE_ID!, token: process.env.FORUM_PAGE_TOKEN! })

async function graph(path: string, params: Record<string, string>, method: 'GET' | 'POST' = 'GET', token = process.env.META_PAGE_TOKEN!) {
  const body = new URLSearchParams({ ...params, access_token: token })
  const res = method === 'GET'
    ? await fetch(`${GRAPH}/${path}?${body}`, { signal: AbortSignal.timeout(20_000) })
    : await fetch(`${GRAPH}/${path}`, { method, body, signal: AbortSignal.timeout(60_000) })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.error) throw new Error(data.error?.message || `HTTP ${res.status}`)
  return data
}

const isToday = (iso?: string) => !!iso && iso.slice(0, 10) === new Date().toISOString().slice(0, 10)

// Cron aynı gün ikinci kez çalışırsa (Vercel bazen tekrarlar) ikinci gönderiyi atmamak için.
async function postedTodayOnPage(page: Page) {
  const d = await graph(`${page.id}/published_posts`, { fields: 'created_time,message', limit: '3' }, 'GET', page.token)
  return (d.data || []).some((p: { created_time?: string; message?: string }) => isToday(p.created_time) && p.message?.includes(MARKER))
}

async function postedTodayOnInstagram() {
  const d = await graph(`${process.env.META_IG_ID}/media`, { fields: 'timestamp,caption', limit: '3' })
  return (d.data || []).some((p: { timestamp?: string; caption?: string }) => isToday(p.timestamp) && p.caption?.includes(MARKER))
}

async function postPhoto(page: Page, imageUrl: string, caption: string) {
  if (await postedTodayOnPage(page)) return 'skipped (already posted today)'
  const d = await graph(`${page.id}/photos`, { url: imageUrl, caption }, 'POST', page.token)
  return `posted ${d.post_id || d.id}`
}

export const postToFacebook = (imageUrl: string, caption: string) => postPhoto(cvzumePage(), imageUrl, caption)
export const postToForum = (imageUrl: string, caption: string) => postPhoto(forumPage(), imageUrl, caption)

export async function postToInstagram(imageUrl: string, caption: string) {
  if (!process.env.META_IG_ID) return 'skipped (META_IG_ID missing)'
  if (await postedTodayOnInstagram()) return 'skipped (already posted today)'
  const { id } = await graph(`${process.env.META_IG_ID}/media`, { image_url: imageUrl, caption }, 'POST')
  // Görsel işlenene kadar yayın reddedilebilir: birkaç kez dene.
  for (let i = 0; i < 6; i++) {
    const s = await graph(id, { fields: 'status_code' })
    if (s.status_code === 'FINISHED') break
    if (s.status_code === 'ERROR') throw new Error('Instagram görseli işleyemedi')
    await new Promise(r => setTimeout(r, 3000))
  }
  const d = await graph(`${process.env.META_IG_ID}/media_publish`, { creation_id: id }, 'POST')
  return `posted ${d.id}`
}
