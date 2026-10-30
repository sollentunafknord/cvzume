// src/app/api/auth/delete-account/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Kullanıcının kendi satırlarını tutan tablolar (user_id kolonu ile).
const USER_TABLES = ['applications', 'job_favorites', 'recent_events', 'usage_limits'];

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userToken = authHeader.replace('Bearer ', '');

    // 1. Token'dan kullanıcıyı bul
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userToken}` } }
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser(userToken);
    if (userError || !user?.email) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // 2. Şifreyi doğrula — çalınmış bir token tek başına hesabı silemesin
    const pwClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { error: pwError } = await pwClient.auth.signInWithPassword({ email: user.email, password: password || '' });
    if (pwError) {
      return NextResponse.json({ error: 'wrong_password' }, { status: 403 });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 3. Email hash'ini deleted_accounts'a kaydet (AuthClient.hashEmail ile aynı: sha256(lower(trim)))
    const emailHash = createHash('sha256').update(user.email.toLowerCase().trim()).digest('hex');
    await adminClient.from('deleted_accounts').upsert({ email_hash: emailHash });

    // 4. Kullanıcı verisini sil
    for (const table of USER_TABLES) {
      const { error } = await adminClient.from(table).delete().eq('user_id', user.id);
      if (error) console.warn(`delete-account: ${table}`, error.message);
    }
    await adminClient.from('profiles').delete().eq('id', user.id);

    // 5. Supabase Auth'dan kullanıcıyı sil
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      throw new Error('Auth deletion error: ' + deleteError.message);
    }

    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error('delete-account error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
