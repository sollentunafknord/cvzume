// "Ny ansökan" dışa aktarma — Word (.docx). PDF tarayıcının yazdırma motoruyla (PrintDocs bileşeni)
// yapılır: tüm dillerin karakterleri doğru basılır ve ekrandaki düzenle aynı görünür.
// docx kütüphanesi sadece tıklanınca yüklenir (sayfa paketi küçük kalsın).

export type ExportPerson = { name: string; email?: string; phone?: string; location?: string; title?: string; photo?: string }
export type ExportExperience = { role?: string; company?: string; start?: string; end?: string; desc?: string }
export type ExportEducation = { school?: string; degree?: string; field?: string; years?: string }
export type ExportCv = { summary: string; experiences: ExportExperience[]; educations: ExportEducation[]; skills: string[]; languages: string[] }
export type CvLabels = { profile: string; experience: string; education: string; skills: string; languages: string; present: string }

const BLUE = '1A56DB'
const NAVY = '0D1B2A'
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

export async function exportCvDocx(person: ExportPerson, cv: ExportCv, labels: CvLabels, filename: string) {
  const d = await import('docx')
  const { Document, Packer, Paragraph, TextRun, BorderStyle, ImageRun, Table, TableRow, TableCell, WidthType, VerticalAlign } = d
  const photo = person.photo ? await photoJpeg(person.photo) : null

  const heading = (text: string) => new Paragraph({
    spacing: { before: 280, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1', space: 2 } },
    children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 20, color: BLUE, characterSpacing: 20 })],
  })
  const contact = [person.email, person.phone, person.location].filter(Boolean).join('  ·  ')

  const head = [
    new Paragraph({ children: [new TextRun({ text: person.name, bold: true, size: 40, color: NAVY })] }),
    ...(person.title ? [new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: person.title, size: 24, color: BLUE })] })] : []),
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

  const doc = new Document({
    styles: { default: { document: { run: { font: 'Calibri' } } } },
    sections: [{ properties: { page: { margin: { top: 900, bottom: 900, left: 1000, right: 1000 } } }, children }],
  })
  download(await Packer.toBlob(doc), `${filename}.docx`)
}

export async function exportLetterDocx(person: ExportPerson, letter: string, filename: string) {
  const { Document, Packer, Paragraph, TextRun } = await import('docx')
  const contact = [person.email, person.phone, person.location].filter(Boolean).join('  ·  ')
  const children = [
    new Paragraph({ children: [new TextRun({ text: person.name, bold: true, size: 28, color: NAVY })] }),
    ...(contact ? [new Paragraph({ spacing: { after: 360 }, children: [new TextRun({ text: contact, size: 18, color: GREY })] })] : []),
    ...letter.split(/\n{2,}/).map(par => new Paragraph({
      spacing: { after: 200 },
      children: par.split('\n').flatMap((line, i) => [...(i ? [new TextRun({ break: 1 })] : []), new TextRun({ text: line, size: 22 })]),
    })),
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
