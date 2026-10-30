import { NextResponse } from 'next/server'
import { callAI, LANG_NAMES, parseJson } from '@/lib/ai'

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
    const result = parseJson<Record<string, unknown>>(text)

    return NextResponse.json({ ...result, provider }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
