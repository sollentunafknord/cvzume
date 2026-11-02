// Günlük sosyal medya cron'u (vercel.json): Facebook sayfası + Instagram'a günün ipucu, pzt/çar/cum Forum İsveç'e.
// Gruplar için hazır metin ve görsel admin panelinde (AdminSocial). ?dry=1 hiçbir şey göndermeden günün içeriğini döndürür.
import { NextResponse } from 'next/server'
import { cardUrl, forumCaption, forumCardUrl, forumToday, pageCaption, today } from '@/lib/social/posts'
import { forumConfigured, metaConfigured, postToFacebook, postToForum, postToInstagram } from '@/lib/social/meta'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const q = new URL(request.url).searchParams
  const { day, tip, pageLang } = today(q.has('day') ? Number(q.get('day')) : undefined)
  const image = cardUrl(tip, pageLang)
  const forumTip = forumToday(day)

  if (q.has('dry')) {
    return NextResponse.json({
      day, tip: tip.id, pageLang, image,
      facebook: pageCaption(tip, pageLang, 'facebook'),
      instagram: pageCaption(tip, pageLang, 'instagram'),
      forum: forumTip ? { image: forumCardUrl(forumTip), caption: forumCaption(forumTip) } : 'bugün yok (pzt/çar/cum)',
    })
  }

  const results: Record<string, string> = {}
  if (!metaConfigured()) {
    results.facebook = results.instagram = 'skipped (META_* env missing)'
  } else {
    // Biri hata verirse diğeri yine denensin.
    results.facebook = await postToFacebook(image, pageCaption(tip, pageLang, 'facebook')).catch(e => `error: ${e.message}`)
    results.instagram = await postToInstagram(image, pageCaption(tip, pageLang, 'instagram')).catch(e => `error: ${e.message}`)
  }
  if (forumTip && forumConfigured()) {
    results.forum = await postToForum(forumCardUrl(forumTip), forumCaption(forumTip)).catch(e => `error: ${e.message}`)
  }
  return NextResponse.json({ ok: true, day, tip: tip.id, pageLang, results })
}
