import { NextResponse } from 'next/server'

// AI Provider fallback sistemi
// Sıra: Gemini → Groq → OpenRouter → tekrar Gemini

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('Gemini key missing')

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  )
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`)
  const data = await res.json()
  return data.candidates[0].content.parts[0].text
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error('Groq key missing')

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    })
  })
  if (!res.ok) throw new Error(`Groq error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content
}

async function callOpenRouter(prompt: string): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) throw new Error('OpenRouter key missing')

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://c-vita.vercel.app',
      'X-Title': 'Cvita'
    },
    body: JSON.stringify({
      model: 'google/gemini-2.0-flash-exp:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000
    })
  })
  if (!res.ok) throw new Error(`OpenRouter error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content
}

async function callAI(prompt: string): Promise<{ text: string; provider: string }> {
  const providers = [
    { name: 'Gemini', fn: callGemini },
    { name: 'Groq', fn: callGroq },
    { name: 'OpenRouter', fn: callOpenRouter },
  ]

  for (const provider of providers) {
    try {
      console.log(`AI çağrısı: ${provider.name}`)
      const text = await provider.fn(prompt)
      return { text, provider: provider.name }
    } catch (err) {
      console.warn(`${provider.name} başarısız, sonrakine geçiliyor...`, err)
    }
  }

  throw new Error('All AI providers failed.')
}

const LANG_NAMES: Record<string, string> = {
  sv: 'Swedish', en: 'English', es: 'Spanish', tr: 'Turkish',
}

export async function POST(request: Request) {
  const { jobAd, userProfile, locale } = await request.json()

  if (!jobAd) {
    return NextResponse.json({ error: 'Job ad is required' }, { status: 400 })
  }

  const outputLang = LANG_NAMES[locale] || 'Swedish'

  // Profil bilgilerini düzenli formata çevir
  let profileText = '';
  if (userProfile && typeof userProfile === 'object') {
    const p = userProfile;
    if (p.title) profileText += `Current title: ${p.title}\n`;
    if (p.summary) profileText += `Summary: ${p.summary}\n`;
    if (p.experiences && p.experiences.length > 0) {
      profileText += `\nWork Experience:\n`;
      p.experiences.forEach((e: any) => {
        profileText += `- ${e.role} at ${e.company} (${e.start || ''}${e.end ? ' – ' + e.end : ''})\n`;
        if (e.desc) profileText += `  ${e.desc}\n`;
      });
    }
    if (p.educations && p.educations.length > 0) {
      profileText += `\nEducation:\n`;
      p.educations.forEach((e: any) => {
        profileText += `- ${e.degree || ''} ${e.field ? 'in ' + e.field : ''} at ${e.school} ${e.years ? '(' + e.years + ')' : ''}\n`;
      });
    }
    if (p.skills && p.skills.length > 0) {
      profileText += `\nSkills: ${p.skills.join(', ')}\n`;
    }
    if (p.languages && p.languages.length > 0) {
      profileText += `Languages: ${p.languages.join(', ')}\n`;
    }
  } else {
    profileText = userProfile || 'Experienced professional with 5 years of experience.';
  }

  const prompt = `You are a professional CV and cover letter writer. Analyze the job ad and the candidate's real profile below.

CRITICAL LANGUAGE RULE: You MUST write ALL output (cvSummary, coverLetter, keyRequirements, tips) in ${outputLang}. This is non-negotiable — the user's interface language is ${outputLang}. Never mix languages.

JOB AD:
${jobAd}

CANDIDATE PROFILE:
${profileText}

Instructions:
- Match the candidate's REAL experience and skills to the job requirements
- Highlight relevant experience from their actual background
- Be specific, not generic
- matchScore should reflect how well the profile matches the job (0-100)

COVER LETTER INSTRUCTIONS (very important):
- Write a FULL, PROFESSIONAL cover letter with exactly 4-5 paragraphs
- Paragraph 1: Opening — express genuine interest in the specific role and company, mention why this company
- Paragraph 2: Your most relevant experience — be specific, mention company names, results, years
- Paragraph 3: Key skills match — connect your skills directly to the job requirements listed in the ad
- Paragraph 4: What you bring / motivation — what unique value you add and why you're the right person
- Paragraph 5 (optional): Closing — polite call to action, looking forward to interview
- Minimum 250 words, aim for 350-400 words
- Write in first person, warm but professional tone
- DO NOT use generic phrases like "I am writing to apply" — start with something engaging

Respond ONLY with this exact JSON format (no other text, no markdown):
{
  "matchScore": 85,
  "keyRequirements": ["requirement1", "requirement2", "requirement3"],
  "cvSummary": "Tailored CV summary using real candidate info...",
  "coverLetter": "Full 4-5 paragraph cover letter here...",
  "tips": ["specific tip based on profile gap", "another tip"]
}`

  try {
    const { text, provider } = await callAI(prompt)

    // JSON parse
    const clean = text.replace(/```json|```/g, '').trim()
    const result = JSON.parse(clean)

    return NextResponse.json({ ...result, provider }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
