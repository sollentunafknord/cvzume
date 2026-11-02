// Gönderilerde "CVzume bunu sizin için nasıl yapar" kısmı: her ipucu bir özelliğe bağlanır,
// ardından herkes için aynı 3 adım. Okuyan kişi ipucundan sitede ne yapacağına net geçsin.
import type { SocialLang, Tip } from './tips'

type Feature = 'match' | 'write' | 'letter' | 'format' | 'track'

const FEATURE_OF: Record<string, Feature> = {
  tailor: 'match', keywords: 'match', 'relevant-first': 'match', 'gap-check': 'match', 'apply-early': 'match', 'interview-star': 'match',
  numbers: 'write', summary: 'write', 'show-skills': 'write', gaps: 'write', honest: 'write', languages: 'write', 'first-job': 'write',
  letter: 'letter',
  length: 'format', pdf: 'format', layout: 'format', photo: 'format', contact: 'format', proofread: 'format',
  'follow-up': 'track',
}

const FEATURE: Record<Feature, Record<SocialLang, string>> = {
  match: {
    sv: 'CVzume läser annonsen, jämför den med ditt CV, visar vad som saknas och anpassar ditt CV till just den annonsen.',
    en: 'CVzume reads the job ad, compares it with your CV, shows what’s missing and tailors your CV to that exact ad.',
    de: 'CVzume liest die Anzeige, vergleicht sie mit Ihrem Lebenslauf, zeigt, was fehlt, und passt Ihren Lebenslauf genau an diese Anzeige an.',
    es: 'CVzume lee la oferta, la compara con tu CV, te muestra lo que falta y adapta tu CV a esa oferta concreta.',
    tr: 'CVzume ilanı okur, CV’nizle karşılaştırır, eksikleri gösterir ve CV’nizi tam o ilana göre düzenler.',
  },
  write: {
    sv: 'Berätta med egna ord vad du har gjort – CVzume gör om det till tydliga CV-rader, utan att hitta på något.',
    en: 'Describe what you did in your own words – CVzume turns it into clear resume bullet points, without making anything up.',
    de: 'Beschreiben Sie in eigenen Worten, was Sie gemacht haben – CVzume macht daraus klare Lebenslauf-Punkte, ohne etwas zu erfinden.',
    es: 'Cuenta con tus propias palabras lo que hiciste: CVzume lo convierte en puntos claros para tu CV, sin inventar nada.',
    tr: 'Ne yaptığınızı kendi cümlelerinizle anlatın – CVzume bunu uydurmadan, net CV maddelerine çevirir.',
  },
  letter: {
    sv: 'CVzume skriver ett utkast till personligt brev utifrån annonsen och ditt CV – du läser igenom och justerar.',
    en: 'CVzume drafts a cover letter from the job ad and your CV – you just review and adjust it.',
    de: 'CVzume entwirft ein Anschreiben auf Basis der Anzeige und Ihres Lebenslaufs – Sie lesen es nur noch durch und passen es an.',
    es: 'CVzume redacta un borrador de carta de presentación a partir de la oferta y tu CV; tú solo lo revisas y ajustas.',
    tr: 'CVzume ilana ve CV’nize göre bir ön yazı taslağı hazırlar – siz sadece okuyup düzeltirsiniz.',
  },
  format: {
    sv: 'I CVzume får du ett enkelt, lättläst CV som PDF eller Word – redo att skicka.',
    en: 'With CVzume you get a clean, easy-to-read CV as a PDF or Word file – ready to send.',
    de: 'Mit CVzume erhalten Sie einen schlichten, gut lesbaren Lebenslauf als PDF oder Word – bereit zum Versenden.',
    es: 'Con CVzume obtienes un CV sencillo y fácil de leer en PDF o Word, listo para enviar.',
    tr: 'CVzume’de CV’niz sade ve okunaklı bir düzenle PDF ya da Word olarak hazırlanır – göndermeye hazır.',
  },
  track: {
    sv: 'Alla dina ansökningar sparas i CVzume under ”Mina ansökningar” – så du vet var och när du har sökt.',
    en: 'All your applications are saved in CVzume under “My applications” – so you always know where and when you applied.',
    de: 'Alle Bewerbungen werden in CVzume unter „Meine Bewerbungen“ gespeichert – so wissen Sie immer, wo und wann Sie sich beworben haben.',
    es: 'Todas tus candidaturas quedan guardadas en CVzume en «Mis solicitudes», así sabes dónde y cuándo te postulaste.',
    tr: 'Tüm başvurularınız CVzume’de “Başvurularım” bölümünde saklanır – nereye ve ne zaman başvurduğunuzu hep bilirsiniz.',
  },
}

const STEPS: Record<SocialLang, string[]> = {
  sv: ['Klistra in annonsen', 'Ladda upp ditt CV – eller svara på några frågor', 'Ladda ner ett anpassat CV och personligt brev'],
  en: ['Paste the job ad', 'Upload your CV – or answer a few questions', 'Download a tailored CV and cover letter'],
  de: ['Anzeige einfügen', 'Lebenslauf hochladen – oder ein paar Fragen beantworten', 'Angepassten Lebenslauf und Anschreiben herunterladen'],
  es: ['Pega la oferta', 'Sube tu CV o responde unas preguntas', 'Descarga tu CV y tu carta adaptados'],
  tr: ['İlanı yapıştırın', 'CV’nizi yükleyin – ya da birkaç soruyu cevaplayın', 'İlana uyarlanmış CV ve ön yazıyı indirin'],
}

/** Kart görselinin altındaki kısa çağrı. */
export const CARD_CTA: Record<SocialLang, string> = {
  sv: 'Klistra in annonsen → få ett anpassat CV', en: 'Paste the job ad → get a tailored CV', de: 'Anzeige einfügen → passender Lebenslauf',
  es: 'Pega la oferta → CV adaptado', tr: 'İlanı yapıştırın → ilana özel CV',
}

/** "CVzume bunu nasıl yapar" + 3 adım. se: Forum İsveç (Türkçe, ön yazı yerine personligt brev). */
export function howBlock(tip: Tip, lang: SocialLang, se = false) {
  let feature = FEATURE[FEATURE_OF[tip.id] ?? 'match'][lang]
  let steps = STEPS[lang]
  if (se) {
    feature = feature.replace('ön yazı', 'personligt brev')
    steps = ['İsveççe ilanı yapıştırın', 'CV’nizi Türkçe yükleyin – ya da birkaç soruyu cevaplayın', 'İsveççe CV ve personligt brev indirin']
  }
  return `✨ ${feature}\n\n${steps.map((x, i) => `${i + 1}️⃣ ${x}`).join('\n')}`
}
