import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Yalnızca OAuth yönlendirmesini başlatmak için. Oturum uygulamada localStorage'da (cvita_token) tutulur;
// dönüşteki #access_token'ı AuthClient kendisi işler → istemci URL'yi okuyup silmesin, oturum saklamasın.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { flowType: 'implicit', detectSessionInUrl: false, persistSession: false, autoRefreshToken: false },
})
