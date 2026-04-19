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

export async function POST(req: Request) {
  try {
    const { role, jobAd } = await req.json();
    if (!role) return NextResponse.json({ error: 'role required' }, { status: 400 });

    const prompt = `Du är en expert karriärcoach som hjälper jobbsökare att förbereda sig för anställningsintervjuer i Sverige.

Roll: ${role}
${jobAd ? `Platsannons:\n${jobAd.slice(0, 2000)}\n` : ''}

Generera 10 troliga intervjufrågor för denna roll, anpassade till det svenska arbetsmarknaden.
Inkludera en blandning av:
- Tekniska/yrkesspecifika frågor
- Beteendefrågor (STAR-metoden)
- Situationsfrågor
- Personliga frågor

Svara ENDAST med ett JSON-objekt i detta exakta format:
{
  "questions": [
    { "category": "Teknisk", "question": "...", "tip": "Tänk på att..." },
    ...
  ]
}

Kategorier att använda: "Teknisk", "Beteende", "Situation", "Personlig", "Företag"`;

    let text: string;
    try { text = await callGemini(prompt); }
    catch { text = await callGroq(prompt); }

    // Extract JSON from response
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('No JSON in response');
    const parsed = JSON.parse(match[0]);

    return NextResponse.json({ questions: parsed.questions || [] });
  } catch (err) {
    console.error('Interview AI error:', err);
    return NextResponse.json({ error: 'AI error' }, { status: 500 });
  }
}
