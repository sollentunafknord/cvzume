// src/app/api/cron/keepalive/route.ts
// Günlük Vercel cron'u bu endpoint'i çağırır ve veritabanına hafif bir sorgu atar.
// Amaç: Supabase free tier'ın 7 günlük hareketsizlik sonrası projeyi
// otomatik duraklatmasını (pause) engellemek. Bkz. vercel.json -> crons.
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { alertIfBroken, checkSources } from '@/lib/source-health'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  // Vercel cron, CRON_SECRET ile Authorization header'ı ekler. Şifre yoksa da uç kapalı
  // (eskiden açıktı: herkes kaynak kontrolünü ve uyarı e-postasını tetikleyebiliyordu).
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

  // Dış ilan kaynakları (Bundesagentur, Platsbanken) — bozuksa e-posta. Cron'u düşürmesin.
  const sources = await checkSources().catch(() => [])
  const alerted = await alertIfBroken(sources).catch(() => false)

  return NextResponse.json({
    ok: true,
    tables: results,
    sources,
    alerted,
    ranAt: new Date().toISOString(),
  })
}
