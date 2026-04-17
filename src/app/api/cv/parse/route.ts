import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const cvText = body.cvText || ''

  if (!cvText || cvText.trim().length < 10) {
    return NextResponse.json({ error: 'Ingen text skickades.' }, { status: 400 })
  }

  const groqKey = process.env.GROQ_API_KEY
  console.log('CV text length:', cvText.length)

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 2000,
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are a CV parser. Return ONLY valid JSON, nothing else.'
          },
          {
            role: 'user',
            content: `Parse this CV and return JSON with exactly these fields:
{
  "title": "current job title",
  "summary": "2-3 sentence professional summary",
  "phone": "phone number or empty string",
  "location": "city and country or empty string",
  "skills": ["skill1", "skill2"],
  "languages": ["language1"],
  "experiences": [{"role":"","company":"","start":"","end":"","desc":""}],
  "educations": [{"school":"","degree":"","field":"","years":""}]
}

CV:
${cvText.substring(0, 8000)}`
          }
        ]
      })
    })

    const groqData = await groqRes.json()
    console.log('Groq status:', groqRes.status)
    const raw = groqData.choices?.[0]?.message?.content || ''

    if (!raw) {
      console.error('Groq empty response:', JSON.stringify(groqData).substring(0, 300))
      return NextResponse.json({ error: 'AI svarade inte.' }, { status: 400 })
    }

    let clean = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const start = clean.indexOf('{')
    const end = clean.lastIndexOf('}')
    if (start !== -1 && end !== -1) clean = clean.substring(start, end + 1)

    const profile = JSON.parse(clean)
    return NextResponse.json({ profile }, { status: 200 })

  } catch (e: any) {
    console.error('CV parse error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
