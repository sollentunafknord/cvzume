// Günlük grup e-postasında önerilen Facebook grupları (dil başına sırayla, her gün biri).
// Gruplara otomatik paylaşım yok (Meta Groups API 2024'te kapandı); metni kullanıcı elle yapıştırır.
// url'si /search/ olanlar arama bağlantısı: katılınan grup netleşince buraya gerçek grup adresiyle eklenmeli.
import type { SocialLang } from './tips'

export type Group = { name: string; url: string }

const search = (q: string) => `https://www.facebook.com/search/groups/?q=${encodeURIComponent(q)}`

export const GROUPS: Record<SocialLang, Group[]> = {
  sv: [
    { name: 'Lediga jobb Stockholm (arama)', url: search('Lediga jobb Stockholm') },
    { name: 'Jobb Göteborg (arama)', url: search('Jobb Göteborg') },
    { name: 'Jobb Malmö (arama)', url: search('Jobb Malmö') },
    { name: 'Lediga jobb Sverige (arama)', url: search('Lediga jobb Sverige') },
    { name: 'Jobb Uppsala (arama)', url: search('Jobb Uppsala') },
  ],
  en: [
    { name: 'ENGLISH SPEAKING JOBS IN GERMANY', url: 'https://www.facebook.com/groups/171987973007402/' },
    { name: 'Expats in Stockholm (arama)', url: search('Expats in Stockholm jobs') },
    { name: 'English Speaking Jobs in Berlin', url: 'https://www.facebook.com/groups/957238694427799/' },
    { name: 'English jobs in Sweden (arama)', url: search('English jobs Sweden') },
    { name: 'The Berlin Life – Find a Job in Berlin', url: 'https://www.facebook.com/groups/findajobinberlinnow/' },
    { name: 'English jobs in Hamburg', url: 'https://www.facebook.com/groups/1665233007033424/' },
  ],
  de: [
    { name: 'Jobs in Deutschland', url: 'https://www.facebook.com/groups/1544234495840625/' },
    { name: 'Arbeit Jobs Stellenangebote in Deutschland', url: 'https://www.facebook.com/groups/158152587947243/' },
    { name: 'Jobs in Berlin', url: 'https://www.facebook.com/groups/stellenmarktberlin/' },
    { name: 'Jobs in Frankfurt', url: 'https://www.facebook.com/groups/1373367392814667/' },
    { name: "Job's in Hamburg", url: 'https://www.facebook.com/groups/jobsinhamburgdasoriginal/' },
    { name: 'Bayern Stellenmarkt / Jobbörse', url: 'https://www.facebook.com/groups/bayern.stellenmarkt/' },
    { name: 'Arbeits/Job-Börse Köln Umgebung', url: 'https://www.facebook.com/groups/712976225543063/' },
  ],
  es: [
    { name: 'Busco Empleo', url: 'https://www.facebook.com/groups/548373885214640' },
    { name: 'Se busca/ofrece: empleo, ayudas…', url: 'https://www.facebook.com/groups/335672603245137' },
    { name: 'Empleo y formación, España', url: 'https://www.facebook.com/groups/463158850380241' },
    { name: 'Ofertas de empleo', url: 'https://www.facebook.com/groups/410541888988246' },
    { name: 'Trabajo completo en España', url: 'https://www.facebook.com/groups/735125909859834' },
  ],
  tr: [
    { name: 'İstanbul iş ilanları (arama)', url: search('İstanbul iş ilanları') },
    { name: 'İş arayanlar (arama)', url: search('iş arayanlar') },
    { name: 'Ankara iş ilanları (arama)', url: search('Ankara iş ilanları') },
    { name: 'İzmir iş ilanları (arama)', url: search('İzmir iş ilanları') },
    { name: 'İsveç’teki Türkler (arama)', url: search('Stockholm Türkler') },
  ],
}
