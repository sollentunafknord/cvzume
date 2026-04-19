import { NextResponse } from 'next/server';

async function callGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini key missing');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    }
  );
  if (!res.ok) throw new Error(`Gemini error: ${res.status}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('Groq key missing');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
    }),
  });
  if (!res.ok) throw new Error(`Groq error: ${res.status}`);
  const data = await res.json();
  return data.choices[0].message.content;
}

const LANG_NAMES: Record<string, string> = {
  sv: 'Swedish', en: 'English', es: 'Spanish', tr: 'Turkish',
}

const CATEGORIES: Record<string, { technical: string; behavioral: string; situational: string; personal: string; company: string }> = {
  sv: { technical: 'Teknisk', behavioral: 'Beteende', situational: 'Situation', personal: 'Personlig', company: 'Företag' },
  en: { technical: 'Technical', behavioral: 'Behavioral', situational: 'Situational', personal: 'Personal', company: 'Company' },
  es: { technical: 'Técnica', behavioral: 'Conducta', situational: 'Situación', personal: 'Personal', company: 'Empresa' },
  tr: { technical: 'Teknik', behavioral: 'Davranış', situational: 'Durum', personal: 'Kişisel', company: 'Şirket' },
}

export async function POST(req: Request) {
  try {
    const { role, jobAd, locale } = await req.json();
    if (!role) return NextResponse.json({ error: 'role required' }, { status: 400 });

    const lang = LANG_NAMES[locale] || 'Swedish';
    const cats = CATEGORIES[locale] || CATEGORIES.sv;

    const prompt = `You are an expert career coach helping job seekers prepare for job interviews.

Role: ${role}
${jobAd ? `Job ad:\n${jobAd.slice(0, 2000)}\n` : ''}

CRITICAL LANGUAGE RULE: Write ALL output in ${lang}. Every question and tip must be in ${lang}.

Generate 10 likely interview questions for this role.
Include a mix of:
- Technical/job-specific questions
- Behavioral questions (STAR method)
- Situational questions
- Personal questions

Use ONLY these exact category names: "${cats.technical}", "${cats.behavioral}", "${cats.situational}", "${cats.personal}", "${cats.company}"

Respond ONLY with a JSON object in this exact format:
{
  "questions": [
    { "category": "${cats.technical}", "question": "...", "tip": "..." },
    ...
  ]
}`;

    let text: string;
    try { text = await callGemini(prompt); }
    catch { text = await callGroq(prompt); }

    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const parsed = JSON.parse(match[0]);

    return NextResponse.json({ questions: parsed.questions || [] });
  } catch (err) {
    console.error('Interview AI error:', err);
    return NextResponse.json({ error: 'AI error' }, { status: 500 });
  }
}
