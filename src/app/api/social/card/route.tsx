// Günlük gönderinin görseli: /api/social/card?tip=<id>&lang=<dil> → 1080×1350 JPEG.
// Instagram yalnızca JPEG kabul ettiği için ImageResponse'un PNG'si sharp ile JPEG'e çevrilir.
// Herkese açık (Facebook/Instagram sunucuları bu adresten çeker); içerik sabit olduğu için uzun önbellek.
import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { SOCIAL_LANGS, TIPS, type SocialLang } from '@/lib/social/tips'
import { LABEL } from '@/lib/social/posts'

export const runtime = 'nodejs'

const W = 1080, H = 1350
const MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="1" y="1" width="62" height="62" rx="15" fill="#23343A"/><rect x="14" y="16" width="22" height="30" rx="3.5" fill="#FBE3A6" transform="rotate(-10 25 31)"/><rect x="27" y="17" width="22" height="30" rx="3.5" fill="#fff" transform="rotate(8 38 32)"/><g transform="rotate(8 38 32)" fill="#3E7F6C"><rect x="31" y="24" width="12" height="2.8" rx="1.4"/><rect x="31" y="30" width="14" height="2.8" rx="1.4"/><rect x="31" y="36" width="9" height="2.8" rx="1.4"/></g></svg>`

let fonts: Promise<Buffer[]> | null = null
const loadFonts = () => (fonts ??= Promise.all(['Lexend-400.ttf', 'Lexend-600.ttf'].map(f => readFile(join(process.cwd(), 'assets/fonts', f)))))

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams
  const tip = TIPS.find(t => t.id === q.get('tip'))
  const lang = q.get('lang') as SocialLang
  if (!tip || !SOCIAL_LANGS.includes(lang)) return new Response('Not found', { status: 404 })
  const t = tip[lang]
  const [regular, semibold] = await loadFonts()
  const titleSize = t.title.length > 42 ? 68 : 78

  const png = new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#F1F6F3', padding: '88px 92px 80px', fontFamily: 'Lexend', color: '#23343A' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`data:image/svg+xml;utf8,${encodeURIComponent(MARK)}`} width={72} height={72} alt="" />
          <span style={{ marginLeft: 20, fontSize: 44, fontWeight: 600, letterSpacing: -1 }}>CVzume</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignSelf: 'flex-start', background: '#E4F3ED', color: '#2F6B59', borderRadius: 999, padding: '12px 28px', fontSize: 32, fontWeight: 600, marginBottom: 44 }}>
            💡 {LABEL[lang]}
          </div>
          <div style={{ fontSize: titleSize, fontWeight: 600, lineHeight: 1.12, letterSpacing: -2 }}>{t.title}</div>
          <div style={{ width: 120, height: 10, background: '#FBE3A6', borderRadius: 5, margin: '44px 0 40px' }} />
          <div style={{ fontSize: t.body.length > 200 ? 31 : 34, lineHeight: 1.5, color: '#3A4C52' }}>{t.body}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 32, color: '#4F6168' }}>
          <span>cvzume.com</span>
          <span style={{ background: '#3E7F6C', color: 'white', borderRadius: 999, padding: '14px 30px', fontWeight: 600 }}>CV · PDF · Word</span>
        </div>
      </div>
    ),
    {
      width: W, height: H,
      emoji: 'twemoji',
      fonts: [
        { name: 'Lexend', data: regular, weight: 400, style: 'normal' },
        { name: 'Lexend', data: semibold, weight: 600, style: 'normal' },
      ],
    },
  )
  const jpg = await sharp(Buffer.from(await png.arrayBuffer())).jpeg({ quality: 90, mozjpeg: true }).toBuffer()
  return new Response(new Uint8Array(jpg), {
    headers: { 'Content-Type': 'image/jpeg', 'Cache-Control': 'public, max-age=86400, s-maxage=604800' },
  })
}
