// src/app/api/auth/signup/route.ts
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)
  const { email, password, firstName, lastName } = await request.json()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      }
    }
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Hoş geldin emaili gönder
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.cvzume.com'
    await fetch(`${baseUrl}/api/email/welcome`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, firstName })
    })
  } catch (e) {
    console.warn('Welcome email gönderilemedi:', e)
  }

  return NextResponse.json({ user: data.user }, { status: 200 })
}
