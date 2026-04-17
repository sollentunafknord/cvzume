// src/app/api/auth/delete-account/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(req: NextRequest) {
  try {
    const { userId, emailHash } = await req.json();

    if (!userId || !emailHash) {
      return NextResponse.json({ error: 'userId ve emailHash gerekli' }, { status: 400 });
    }

    // Bearer token al
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
    }
    const userToken = authHeader.replace('Bearer ', '');

    // 1. Kullanıcı token'ını doğrula (anon client ile)
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${userToken}` } }
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user || user.id !== userId) {
      return NextResponse.json({ error: 'Geçersiz token' }, { status: 401 });
    }

    // 2. Admin client oluştur (service role key ile)
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // 3. Email hash'ini deleted_accounts tablosuna kaydet
    await adminClient.from('deleted_accounts').upsert({ email_hash: emailHash });

    // 4. Profiles tablosundaki veriyi sil
    await adminClient.from('profiles').delete().eq('id', userId);

    // 5. Supabase Auth'dan kullanıcıyı sil
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      throw new Error('Auth silme hatası: ' + deleteError.message);
    }

    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error('delete-account error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
