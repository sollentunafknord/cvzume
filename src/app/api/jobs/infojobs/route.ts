// InfoJobs (İspanya) araması, ilan detayı ve il sözlüğü. Mantık: src/lib/infojobs.ts
import { NextResponse } from 'next/server'
import { ijDetail, ijProvinces, ijSearch, infojobsConfigured, infojobsSearchUrl, InfoJobsError } from '@/lib/infojobs'

function fail(err: unknown, fallbackUrl?: string) {
  const code = err instanceof InfoJobsError ? err.code : 'unavailable'
  if (!(err instanceof InfoJobsError)) console.error('infojobs failed', err)
  const status = code === 'not_found' ? 404 : 503
  return NextResponse.json({ error: code, ...(fallbackUrl ? { fallbackUrl } : {}) }, { status })
}

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams
  const q = (sp.get('q') || '').trim().slice(0, 100)

  if (!infojobsConfigured()) {
    return NextResponse.json({ error: 'not_configured', fallbackUrl: infojobsSearchUrl(q) }, { status: 503 })
  }

  if (sp.get('provinces')) {
    try {
      return NextResponse.json({ provinces: await ijProvinces() }, { headers: { 'Cache-Control': 'public, s-maxage=86400' } })
    } catch (err) { return fail(err) }
  }

  const detail = sp.get('detail')
  if (detail) {
    try {
      const ad = await ijDetail(detail)
      if (ad.text.length < 50) return NextResponse.json({ error: 'no_content' }, { status: 502 })
      return NextResponse.json(ad)
    } catch (err) { return fail(err) }
  }

  const province = (sp.get('province') || '').replace(/\D/g, '').slice(0, 4)
  const page = Math.max(1, Number(sp.get('page')) || 1)
  try {
    return NextResponse.json(await ijSearch({ q, province, page }))
  } catch (err) {
    return fail(err, infojobsSearchUrl(q))
  }
}
