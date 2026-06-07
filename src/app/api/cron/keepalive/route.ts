// src/app/api/cron/keepalive/route.ts
// Günlük Vercel cron'u bu endpoint'i çağırır ve veritabanına hafif bir sorgu atar.
// Amaç: Supabase free tier'ın 7 günlük hareketsizlik sonrası projeyi
// otomatik duraklatmasını (pause) engellemek. Bkz. vercel.json -> crons.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Vercel cron, CRON_SECRET tanımlıysa Authorization header'ı ekler.
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  // Client'ı handler içinde oluştur — modül seviyesinde oluşturmak
  // env yokken build'i kırar.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  // Hafif bir sorgu: tek satır bile dönmese DB'ye gider ve "aktivite" sayılır.
  const { count, error } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    profiles: count,
    ranAt: new Date().toISOString(),
  })
}
