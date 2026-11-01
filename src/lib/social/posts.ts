// Linkler tanıtım sayfasına (/<dil>) gider; akış sayfası girişsiz ziyaretçiyi oturum açmaya yollar.
// Günün gönderisi: hangi ipucu, hangi dil, hangi metin. Cron, kart görseli ve e-posta aynı hesabı kullanır.
import { SOCIAL_LANGS, TIPS, type SocialLang, type Tip } from './tips'
import { GROUPS, type Group } from './groups'

const SITE = 'https://www.cvzume.com'
const DAY = 86_400_000

export const LABEL: Record<SocialLang, string> = {
  sv: 'Jobbtips', en: 'Job tip', de: 'Bewerbungstipp', es: 'Consejo de empleo', tr: 'İş arama ipucu',
}

const CTA: Record<SocialLang, { link: string; bio: string }> = {
  sv: { link: 'Anpassa ditt CV och personliga brev till annonsen – gratis att börja 👉', bio: 'Anpassa ditt CV till annonsen – gratis att börja. Länk i bion 👆' },
  en: { link: 'Tailor your CV and cover letter to the job ad – free to start 👉', bio: 'Tailor your CV to the job ad – free to start. Link in bio 👆' },
  de: { link: 'Lebenslauf und Anschreiben passend zur Anzeige – kostenlos starten 👉', bio: 'Lebenslauf passend zur Anzeige – kostenlos starten. Link in der Bio 👆' },
  es: { link: 'Adapta tu CV y tu carta a cada oferta, gratis para empezar 👉', bio: 'Adapta tu CV a cada oferta, gratis para empezar. Enlace en la bio 👆' },
  tr: { link: 'CV’nizi ve ön yazınızı ilana göre uyarlayın – ücretsiz başlayın 👉', bio: 'CV’nizi ilana göre uyarlayın – ücretsiz başlayın. Link profilde 👆' },
}

// #cvzume her otomatik gönderide var: cron aynı gün ikinci kez çalışırsa bunu görüp atlar.
const TAGS: Record<SocialLang, string> = {
  sv: '#jobbsökning #cv #personligtbrev #jobbtips #cvzume',
  en: '#jobsearch #resume #coverletter #careertips #cvzume',
  de: '#jobsuche #lebenslauf #bewerbung #bewerbungstipps #cvzume',
  es: '#buscotrabajo #empleo #cv #consejos #cvzume',
  tr: '#işarama #cv #özgeçmiş #kariyer #cvzume',
}

export const MARKER = '#cvzume'

const link = (lang: SocialLang, medium: string, tip: Tip) =>
  `${SITE}/${lang}?utm_source=facebook&utm_medium=${medium}&utm_campaign=tip-${tip.id}`

export const dayNumber = (now = Date.now()) => Math.floor(now / DAY)

// Sayfa dili her gün döner; ipucu sayısı 5'in katı olmadığından her ipucu zamanla her dilde çıkar.
export function today(day = dayNumber()) {
  const tip = TIPS[day % TIPS.length]
  const pageLang = SOCIAL_LANGS[day % SOCIAL_LANGS.length]
  return { day, tip, pageLang }
}

export const cardUrl = (tip: Tip, lang: SocialLang) => `${SITE}/api/social/card?tip=${tip.id}&lang=${lang}`

export function pageCaption(tip: Tip, lang: SocialLang, network: 'facebook' | 'instagram') {
  const t = tip[lang]
  const cta = network === 'facebook' ? `${CTA[lang].link} ${link(lang, 'page', tip)}` : CTA[lang].bio
  return `💡 ${t.title}\n\n${t.body}\n\n${cta}\n\n${TAGS[lang]}`
}

// Grup metni: etiketsiz, satış dili hafif; link en sonda (grup kuralları çoğunlukla bunu kabul ediyor).
export function groupText(tip: Tip, lang: SocialLang) {
  const t = tip[lang]
  return `💡 ${t.title}\n\n${t.body}\n\n${CTA[lang].link} ${link(lang, 'group', tip)}`
}

export const groupFor = (lang: SocialLang, day: number): Group => GROUPS[lang][day % GROUPS[lang].length]
