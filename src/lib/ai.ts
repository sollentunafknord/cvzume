// Ortak AI çağrısı — analyze ve landing demo'su kullanır.
// Model adları: sabit sürüm yerine "latest" takma adları — 2.0 modelleri emekliye
// ayrılınca (404) tüm sağlayıcılar birden düştü. Groq/OpenRouter için listeyi
// https://api.groq.com/openai/v1/models ve https://openrouter.ai/api/v1/models'tan kontrol et.
const GEMINI_MODEL = 'gemini-flash-latest'
// Groq ücretsiz katman: model başına dakikada 8000 token. Her modelin limiti ayrı olduğu için
// biri dolunca sıradakine geçiyoruz (kapasite ~3 katı). Kalıcı çözüm: Groq'ta faturalandırmayı açmak.
const GROQ_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b']
const OPENROUTER_MODEL = 'google/gemma-4-31b-it:free'
// Bir sağlayıcı asılı kalırsa sıradakine geçebilmek için
const TIMEOUT_MS = 25_000

// AI Provider fallback sistemi
// Sıra: Groq → Gemini → OpenRouter

async function callGemini(prompt: string, json = false, maxTokens = 4000): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini key missing')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, ...(json ? { responseMimeType: 'application/json' } : {}) },
      })
    }
  )
  if (!res.ok) throw new ProviderError(`Gemini error: ${res.status}`, res.status)
  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}

async function callGroq(prompt: string, json = false, model = GROQ_MODELS[0], maxTokens = 4000): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('Groq key missing')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      // gpt-oss bir reasoning modeli; düşünme token'ları da bu sınıra dahil
      reasoning_effort: 'low',
      max_tokens: maxTokens,
      // JSON modu: model sözdizimsel olarak geçerli JSON döndürür (kaçırılmamış tırnaklar vb.)
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    })
  })
  if (!res.ok) throw new ProviderError(`Groq ${model} error: ${res.status}`, res.status, Number(res.headers.get('retry-after')) || 0)
  const data = await res.json()
  return data.choices[0].message.content
}

async function callOpenRouter(prompt: string, json = false, maxTokens = 2000): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OpenRouter key missing')

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://www.cvzume.com',
      'X-Title': 'CVzume'
    },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      ...(json ? { response_format: { type: 'json_object' } } : {}),
    })
  })
  if (!res.ok) throw new ProviderError(`OpenRouter error: ${res.status}`, res.status)
  const data = await res.json()
  return data.choices[0].message.content
}

class ProviderError extends Error {
  constructor(message: string, public status: number, public retryAfter = 0) { super(message) }
}

type ProviderFn = (prompt: string, json: boolean, maxTokens: number) => Promise<string>

// Groq modelleri önde: hızlı ve çalışıyor. Gemini anahtarı (AEA, faturalandırma yok) yavaş/503.
const PROVIDERS: { name: string; fn: ProviderFn }[] = [
  ...GROQ_MODELS.map(m => ({ name: `Groq ${m}`, fn: ((p, j, t) => callGroq(p, j, m, t)) as ProviderFn })),
  { name: 'Gemini', fn: (p, j, t) => callGemini(p, j, t) },
  { name: 'OpenRouter', fn: (p, j, t) => callOpenRouter(p, j, Math.min(t, 2000)) },
]

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function callAI(prompt: string): Promise<{ text: string; provider: string }> {
  for (const provider of PROVIDERS) {
    try {
      console.log(`AI çağrısı: ${provider.name}`)
      const text = await provider.fn(prompt, false, 4000)
      return { text, provider: provider.name }
    } catch (err) {
      console.warn(`${provider.name} başarısız, sonrakine geçiliyor...`, err)
    }
  }

  throw new Error('All AI providers failed.')
}

// JSON bekleyen tüm çağrılar bunu kullanmalı. 2026-10-30: Groq JSON modu olmadan bazen
// kaçırılmamış tırnaklı bozuk JSON döndürdü ve demo doğrudan "AI-tjänsten svarar inte" dedi.
export async function callAIJson<T>(prompt: string, maxTokens = 4000): Promise<{ data: T; provider: string }> {
  for (const provider of PROVIDERS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const text = await provider.fn(prompt, true, maxTokens)
        return { data: parseJson<T>(text), provider: provider.name }
      } catch (err) {
        console.warn(`${provider.name} (deneme ${attempt + 1}) başarısız`, err instanceof Error ? err.message : err)
        // Bozuk JSON → aynı sağlayıcıda bir kez daha. 429 ve kısa bekleme süresi → bekle, tekrar.
        // Diğer hatalarda (uzun 429, 5xx, zaman aşımı) doğrudan sıradaki modele/sağlayıcıya geç.
        if (err instanceof SyntaxError) continue
        if (err instanceof ProviderError && err.status === 429 && err.retryAfter > 0 && err.retryAfter <= 4) {
          await sleep(err.retryAfter * 1000)
          continue
        }
        break
      }
    }
  }
  throw new Error('All AI providers failed.')
}

export const LANG_NAMES: Record<string, string> = {
  sv: 'Swedish', en: 'English', es: 'Spanish', tr: 'Turkish', de: 'German',
}

// Model bazen JSON'u ```json bloğuna sarıyor ya da önüne metin ekliyor.
export function parseJson<T>(text: string): T {
  const clean = text.replace(/```json|```/g, '').trim()
  const first = clean.indexOf('{')
  const last = clean.lastIndexOf('}')
  return JSON.parse(first >= 0 && last > first ? clean.slice(first, last + 1) : clean)
}

// İlanın ülkesini modelin kendisi çıkarsın (İsveç'teki bir Türk İsveççe ilana, Türkiye'deki
// biri Türkçe ilana başvurur — arayüz dili ülkeyi söylemez). Belirsizse İsveç.
export const COUNTRY_RULE = `JOB MARKET: Infer which country the job is in from the ad (language, place names, currency, employer). If unclear, assume Sweden. Apply that country's application conventions (CV format, tone, whether a photo is customary, Europass in Spain, formal tone in Turkey, tabellarischer Lebenslauf in Germany) and never assume Swedish conventions for a job in another country. Never advise putting national ID numbers (personnummer, T.C. kimlik no, DNI/NIE, Steuer-ID/Sozialversicherungsnummer), full date of birth, marital status or other sensitive personal data in a CV or letter.`

// Hitap standardı (arayüz metinleriyle aynı): kullanıcıya Türkçe "siz", İspanyolca "tú",
// İsveççe "du", İngilizce "you". İşverene giden metin (ön yazı) o dilin resmi üslubunda.
export const ADDRESS_RULE = `FORM OF ADDRESS: When addressing the user (tips, feedback, interview advice), use exactly this register and never mix: Turkish = formal "siz" (e.g. "ekleyin", "deneyiminiz"), Spanish = informal "tú" (e.g. "añade", "tu experiencia"), German = formal "Sie" (e.g. "Fügen Sie … hinzu", "Ihre Erfahrung"), Swedish = "du", English = "you" with American spelling (analyze, favorite, license). Texts written for the employer (cover letter, CV summary) are in first person and use the formal register customary in that language (Turkish: "Sayın Yetkili", siz; Spanish: usted towards the employer; German: "Sehr geehrte Damen und Herren", Sie). Never mix in English terms (e.g. write "ön yazı", not "cover letter") unless the output language is English.`
