// "Ny ansökan" dışa aktarma — Word (.docx). PDF tarayıcının yazdırma motoruyla (PrintDocs bileşeni)
// yapılır: tüm dillerin karakterleri doğru basılır ve ekrandaki düzenle aynı görünür.
// docx kütüphanesi sadece tıklanınca yüklenir (sayfa paketi küçük kalsın).

export type ExportPerson = { name: string; email?: string; phone?: string; location?: string; title?: string; photo?: string }
/** Ücretsiz planda belgenin en altındaki küçük ibare (Pro'da boş). */
export type ExportOptions = { footer?: string; accent?: string; ink?: string }
export type ExportExperience = { role?: string; company?: string; start?: string; end?: string; desc?: string }
export type ExportEducation = { school?: string; degree?: string; field?: string; years?: string }
export type ExportCv = { summary: string; experiences: ExportExperience[]; educations: ExportEducation[]; skills: string[]; languages: string[] }
export type CvLabels = { profile: string; experience: string; education: string; skills: string; languages: string; present: string }

const BLUE = '3E7F6C'
const NAVY = '23343A'
const GREY = '64748B'

export function safeFileName(...parts: string[]): string {
  return parts.filter(Boolean).join(' - ').replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').trim().slice(0, 90) || 'CVzume'
}

export const period = (start?: string, end?: string, present = '') =>
  [start, end || (start ? present : '')].filter(Boolean).join(' – ')

export const descLines = (desc?: string) =>
  (desc || '').split('\n').map(l => l.replace(/^[-•·]\s*/, '').trim()).filter(Boolean)

// Fotoğrafı kare kırpıp JPEG'e çevirir (Word webp'yi göstermez). Yüklenemezse null → fotoğrafsız CV.
async function photoJpeg(url: string): Promise<Uint8Array | null> {
  try {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    await img.decode()
    const side = Math.min(img.naturalWidth, img.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = Math.min(side, 400)
    canvas.getContext('2d')!.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.9))
    return blob ? new Uint8Array(await blob.arrayBuffer()) : null
  } catch {
    return null
  }
}

type DocxMod = typeof import('docx')
function footerLine(text: string, Paragraph: DocxMod['Paragraph'], TextRun: DocxMod['TextRun']) {
  return new Paragraph({ alignment: 'center', spacing: { before: 480 }, children: [new TextRun({ text, size: 15, color: 'A0AEC0' })] })
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function exportCvDocx(person: ExportPerson, cv: ExportCv, labels: CvLabels, filename: string, opts: ExportOptions = {}) {
  const d = await import('docx')
  const { Document, Packer, Paragraph, TextRun, BorderStyle, ImageRun, Table, TableRow, TableCell, WidthType, VerticalAlign } = d
  const photo = person.photo ? await photoJpeg(person.photo) : null

  const BLUE_ = opts.accent ?? BLUE, NAVY_ = opts.ink ?? NAVY
  const heading = (text: string) => new Paragraph({
    spacing: { before: 280, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1', space: 2 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 20, color: BLUE_, characterSpacing: 20 })],
  })
  const contact = [person.email, person.phone, person.location].filter(Boolean).join('  ·  ')

  const head = [
    new Paragraph({ children: [new TextRun({ text: person.name, bold: true, size: 40, color: NAVY_ })] }),
    ...(person.title ? [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: person.title, size: 24, color: BLUE_ })] })] : []),
    ...(contact ? [new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: contact, size: 18, color: GREY })] })] : []),
  ]
  // Fotoğraf varsa başlık iki sütun: solda ad/iletişim, sağda fotoğraf (çerçevesiz tablo)
  const none = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
  const noBorders = { top: none, bottom: none, left: none, right: none, insideHorizontal: none, insideVertical: none }
  const children: (InstanceType<typeof Paragraph> | InstanceType<typeof Table>)[] = photo ? [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: noBorders,
    rows: [new TableRow({ children: [
      new TableCell({ borders: noBorders, verticalAlign: VerticalAlign.CENTER, width: { size: 80, type: WidthType.PERCENTAGE }, children: head }),
      new TableCell({ borders: noBorders, verticalAlign: VerticalAlign.CENTER, width: { size: 20, type: WidthType.PERCENTAGE }, children: [
        new Paragraph({ alignment: 'right', children: [new ImageRun({ type: 'jpg', data: photo, transformation: { width: 96, height: 96 } })] }),
      ] }),
    ] })],
  })] : head

  if (cv.summary.trim()) {
    children.push(heading(labels.profile), new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: cv.summary.trim(), size: 21 })] }))
  }
  if (cv.experiences.length) {
    children.push(heading(labels.experience))
    for (const e of cv.experiences) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 20 },
        children: [
          new TextRun({ text: e.role || '', bold: true, size: 22, color: NAVY }),
          new TextRun({ text: e.company ? `  —  ${e.company}` : '', size: 22, color: NAVY }),
        ],
      }))
      const p = period(e.start, e.end, labels.present)
      if (p) children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p, size: 18, color: GREY })] }))
      for (const line of descLines(e.desc)) {
        children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 20 }, children: [new TextRun({ text: line, size: 21 })] }))
      }
    }
  }
  if (cv.educations.length) {
    children.push(heading(labels.education))
    for (const e of cv.educations) {
      children.push(new Paragraph({
        spacing: { before: 80, after: 20 },
        children: [
          new TextRun({ text: [e.degree, e.field].filter(Boolean).join(', '), bold: true, size: 21, color: NAVY }),
          new TextRun({ text: e.school ? `  —  ${e.school}` : '', size: 21 }),
          new TextRun({ text: e.years ? `   ${e.years}` : '', size: 18, color: GREY }),
        ],
      }))
    }
  }
  if (cv.skills.length) children.push(heading(labels.skills), new Paragraph({ children: [new TextRun({ text: cv.skills.join('  ·  '), size: 21 })] }))
  if (cv.languages.length) children.push(heading(labels.languages), new Paragraph({ children: [new TextRun({ text: cv.languages.join('  ·  '), size: 21 })] }))
  if (opts.footer) children.push(footerLine(opts.footer, Paragraph, TextRun))

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{ properties: { page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } }, children }],
  })
  download(await Packer.toBlob(doc), `${filename}.docx`)
}

export async function exportLetterDocx(person: ExportPerson, letter: string, filename: string, opts: ExportOptions & { meta?: LetterMeta } = {}) {
  const { Document, Packer, Paragraph, TextRun, BorderStyle } = await import('docx')
  const contact = [person.location, person.phone, person.email].filter(Boolean).join('  ·  ')
  const accent = opts.accent ?? BLUE, ink = opts.ink ?? NAVY
  const m = opts.meta
  const children = [
    // Mektup başlığı: ad normal büyüklükte, altında iletişim; ince çizgiyle gövdeden ayrılır
    new Paragraph({ children: [new TextRun({ text: person.name, bold: true, size: 30, color: ink })] }),
    ...(contact ? [new Paragraph({ spacing: { after: 120 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D5DAD6', space: 6 } }, children: [new TextRun({ text: contact, size: 18, color: GREY })] })] : []),
    ...(m?.date ? [new Paragraph({ alignment: 'right', spacing: { before: 240, after: 240 }, children: [new TextRun({ text: m.date, size: 20, color: GREY })] })] : []),
    ...(m?.recipient ? [new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: m.recipient, size: 22 })] })] : []),
    ...(m?.subject ? [new Paragraph({ spacing: { after: 280 }, children: [new TextRun({ text: m.subject, bold: true, size: 24, color: accent })] })] : []),
    ...letter.split(/\n{2,}/).map(par => new Paragraph({
      spacing: { after: 200 },
      children: par.split('\n').flatMap((line, i) => [...(i ? [new TextRun({ break: 1 })] : []), new TextRun({ text: line, size: 22 })]),
    })),
    ...(opts.footer ? [footerLine(opts.footer, Paragraph, TextRun)] : []),
  ]
  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{ properties: { page: { margin: { top: 1200, bottom: 1200, left: 1300, right: 1300 } } }, children }],
  })
  download(await Packer.toBlob(doc), `${filename}.docx`)
}

/** PrintDocument portalı çizildikten ve fotoğrafı yüklendikten sonra yazdırma penceresini açar. */
export async function printPortal(title: string) {
  await new Promise(r => setTimeout(r, 50))
  const imgs = Array.from(document.querySelectorAll<HTMLImageElement>('.cvzume-print img'))
  await Promise.race([Promise.all(imgs.map(i => i.decode().catch(() => {}))), new Promise(r => setTimeout(r, 3000))])
  const old = document.title
  document.title = title
  window.print()
  document.title = old
}

// ── Belgenin dili, ücretsiz plan ibaresi ve mektup biçimi ──
export type DocLang = 'sv' | 'en' | 'tr' | 'de' | 'es'
const LANG_HINTS: Record<DocLang, RegExp> = {
  sv: /\b(och|att|jag|för|med|som|på|är|av|erfarenhet|arbetat|ansvar)\b|[åä]/gi,
  en: /\b(and|the|with|for|of|experience|worked|responsible|skills)\b/gi,
  tr: /\b(ve|ile|bir|için|olarak|deneyim|sorumlu|çalıştım)\b|[ğışçİ]/gi,
  de: /\b(und|der|die|das|mit|für|ich|Erfahrung|verantwortlich)\b|ß/gi,
  es: /\b(y|el|la|los|con|para|experiencia|responsable|trabajé)\b|ñ/gi,
}
/** Metnin (CV/mektup) dilini kaba bir sayımla tahmin eder; bulunamazsa yedek dil. */
export function docLang(text: string, fallback: string): DocLang {
  let best: DocLang | null = null, n = 0
  for (const l of Object.keys(LANG_HINTS) as DocLang[]) {
    const c = (text.match(LANG_HINTS[l]) || []).length
    if (c > n) { n = c; best = l }
  }
  return best && n >= 3 ? best : ((['sv', 'en', 'tr', 'de', 'es'] as string[]).includes(fallback) ? fallback as DocLang : 'en')
}
export const DOC_LANGS: DocLang[] = ['sv', 'en', 'de', 'es', 'tr']
/** Dil seçicide her dil kendi adıyla görünür. */
export const DOC_LANG_NAMES: Record<DocLang, string> = { sv: 'Svenska', en: 'English', de: 'Deutsch', es: 'Español', tr: 'Türkçe' }
export const isDocLang = (v: string): v is DocLang => (DOC_LANGS as string[]).includes(v)
/** CV bölüm başlıkları belgenin dilinde (arayüz dili değil): Türkçe arayüzde İsveççe CV → İsveççe başlıklar. */
const CV_LABELS: Record<DocLang, CvLabels> = {
  sv: { profile: 'Profil', experience: 'Arbetslivserfarenhet', education: 'Utbildning', skills: 'Kompetenser', languages: 'Språk', present: 'nu' },
  en: { profile: 'Profile', experience: 'Work experience', education: 'Education', skills: 'Skills', languages: 'Languages', present: 'present' },
  de: { profile: 'Profil', experience: 'Berufserfahrung', education: 'Ausbildung', skills: 'Kompetenzen', languages: 'Sprachen', present: 'heute' },
  es: { profile: 'Perfil', experience: 'Experiencia laboral', education: 'Formación', skills: 'Competencias', languages: 'Idiomas', present: 'actualidad' },
  tr: { profile: 'Profil', experience: 'İş deneyimi', education: 'Eğitim', skills: 'Yetkinlikler', languages: 'Diller', present: 'halen' },
}
export const cvLabelsFor = (lang: DocLang) => CV_LABELS[lang]
const FREE_FOOTER: Record<DocLang, string> = {
  sv: 'Skapad med CVzume · cvzume.com', en: 'Made with CVzume · cvzume.com', tr: 'CVzume ile oluşturuldu · cvzume.com',
  de: 'Erstellt mit CVzume · cvzume.com', es: 'Creado con CVzume · cvzume.com',
}
/** Ücretsiz planda belgenin en altındaki küçük ibare, belgenin kendi dilinde. */
export const freeFooter = (lang: DocLang) => FREE_FOOTER[lang]
export const cvText = (cv: ExportCv) => [cv.summary, ...cv.experiences.map(e => `${e.role} ${e.desc}`), ...cv.skills].join(' ')

export type LetterMeta = { date: string; subject: string; recipient?: string }
const SUBJECT: Record<DocLang, (role: string) => string> = {
  sv: r => `Ansökan: ${r}`, en: r => `Application: ${r}`, tr: r => `Başvuru: ${r}`, de: r => `Bewerbung als ${r}`, es: r => `Solicitud: ${r}`,
}
const DATE_LOCALE: Record<DocLang, string> = { sv: 'sv-SE', en: 'en-US', tr: 'tr-TR', de: 'de-DE', es: 'es-ES' }
/** Mektubun yer/tarih satırı, konu satırı ve alıcısı (rol "Unvan — Şirket" biçiminde gelebilir). */
export function letterMeta(lang: DocLang, role: string, location?: string, employer?: string): LetterMeta {
  const [title, company] = role.split(' — ')
  const city = (location || '').split(',').pop()?.replace(/\d{3,}\s*/g, '').trim()
  const date = new Date().toLocaleDateString(DATE_LOCALE[lang], { day: 'numeric', month: 'long', year: 'numeric' })
  return { date: city ? `${city}, ${date}` : date, subject: title ? SUBJECT[lang](title.trim()) : '', recipient: (employer || company || '').trim() || undefined }
}
