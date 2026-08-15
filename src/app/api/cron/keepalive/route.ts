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

  // Supabase'in ölçütü "her gün DB'ye birkaç istek" — tek sorgu eşiğin altında
  // kalıyordu. Bu yüzden her çalışmada birden fazla tabloya dokunuyoruz.
  // Asıl yük .github/workflows/supabase-keepalive.yml üzerinde; burası ikinci bacak.
  const tables = ['profiles', 'job_favorites', 'fon_posts'] as const
  const results: Record<string, number | null> = {}

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      return NextResponse.json(
        { ok: false, table, error: error.message },
        { status: 500 },
      )
    }
    results[table] = count
  }

  return NextResponse.json({
    ok: true,
    tables: results,
    ranAt: new Date().toISOString(),
  })
}
