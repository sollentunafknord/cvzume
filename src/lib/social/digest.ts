// Her sabah gelen "bugün gruplara ne paylaşayım" e-postası: her dil için bir grup + o dilde hazır metin.
// Metin elle kopyalanıp gruba yapıştırılır (gruplara otomatik paylaşım Meta tarafından kapatıldı).
import { SOCIAL_LANGS, type SocialLang, type Tip } from './tips'
import { cardUrl, groupFor, groupText } from './posts'

const FLAG: Record<SocialLang, string> = { sv: '🇸🇪 İsveççe', en: '🇬🇧 İngilizce', de: '🇩🇪 Almanca', es: '🇪🇸 İspanyolca', tr: '🇹🇷 Türkçe' }
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function digestHtml(tip: Tip, day: number, pageResults: Record<string, string>) {
  const sections = SOCIAL_LANGS.map(lang => {
    const g = groupFor(lang, day)
    return `<h3 style="margin:28px 0 6px">${FLAG[lang]}</h3>
<p style="margin:0 0 8px">Grup: <a href="${g.url}">${esc(g.name)}</a> · <a href="${cardUrl(tip, lang)}">görseli indir</a></p>
<pre style="white-space:pre-wrap;font-family:inherit;background:#F1F6F3;border:1px solid #DCE6E0;border-radius:10px;padding:14px;margin:0">${esc(groupText(tip, lang))}</pre>`
  }).join('\n')
  const status = Object.entries(pageResults).map(([k, v]) => `<li>${esc(k)}: ${esc(v)}</li>`).join('')
  return `<div style="font-family:system-ui,sans-serif;color:#23343A;max-width:640px">
<p>Günaydın! Bugünün ipucu: <strong>${esc(tip.tr.title)}</strong></p>
<p>Her dil için grubu açın, metni kopyalayıp yapıştırın (isterseniz görseli de ekleyin). Günde en fazla 5 grup – Facebook'un spam filtresine takılmamak için.
Gruba henüz üye değilseniz önce katılın; "(arama)" yazanlar Facebook aramasını açar, aktif bir grup seçin.</p>
${sections}
<p style="margin-top:28px;color:#4F6168;font-size:13px">Sayfa gönderileri:</p><ul style="color:#4F6168;font-size:13px">${status}</ul>
</div>`
}

export async function sendDigest(tip: Tip, day: number, pageResults: Record<string, string>) {
  const key = process.env.RESEND_API_KEY
  if (!key) return 'skipped (RESEND_API_KEY missing)'
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'CVzume <noreply@cvzume.com>',
      to: [process.env.SOCIAL_DIGEST_TO || 'hello@cvzume.com'],
      subject: `Bugünün grup paylaşımları: ${tip.tr.title}`,
      html: digestHtml(tip, day, pageResults),
    }),
    signal: AbortSignal.timeout(10_000),
  })
  return res.ok ? 'sent' : `failed (HTTP ${res.status})`
}
