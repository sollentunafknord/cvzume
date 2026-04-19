// src/app/api/admin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const getStripe = () => new Stripe(process.env.STRIPE_SECRET_KEY!);

const ADMIN_EMAILS = ['cyesil@gmail.com'];

async function verifyAdmin(token: string): Promise<boolean> {
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) return false;
  return ADMIN_EMAILS.includes(user.email || '');
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    if (!(await verifyAdmin(token))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 1. Get all Supabase Auth users
    const { data: { users }, error } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    if (error) throw error;

    // 2. Get profiles (avatar_url, title, location)
    const { data: profiles } = await adminClient
      .from('profiles')
      .select('id, avatar_url, title, location');
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // 3. Get Stripe subscriptions
    const allSubs = await getStripe().subscriptions.list({ status: 'active', limit: 100 });
    const stripeMap = new Map<string, { isPro: boolean; interval: string | null; subId: string }>();
    for (const sub of allSubs.data) {
      const customer = await getStripe().customers.retrieve(sub.customer as string);
      if ('email' in customer && customer.email) {
        stripeMap.set(customer.email, {
          isPro: true,
          interval: sub.items.data[0]?.plan?.interval || null,
          subId: sub.id
        });
      }
    }

    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const usersWithPlan = users.map((u: any) => {
      const stripePlan = stripeMap.get(u.email || '') || { isPro: false, interval: null, subId: null };
      const profile = profileMap.get(u.id) as any;
      
      // Get name from auth metadata (email/password signup stores in raw_user_meta_data)
      const meta = u.user_metadata || u.raw_user_meta_data || {};
      const firstName = meta.first_name || meta.given_name || meta.full_name?.split(' ')[0] || '';
      const lastName = meta.last_name || meta.family_name || meta.full_name?.split(' ').slice(1).join(' ') || '';

      return {
        id: u.id,
        email: u.email,
        first_name: firstName,
        last_name: lastName,
        avatar_url: profile?.avatar_url || meta.avatar_url || meta.picture || null,
        title: profile?.title || null,
        created_at: u.created_at,
        last_sign_in: u.last_sign_in_at,
        isPro: stripePlan.isPro,
        plan_interval: stripePlan.interval,
        stripe_sub_id: stripePlan.subId,
        confirmed: !!u.email_confirmed_at,
        provider: u.app_metadata?.provider || 'email',
      };
    });

    const totalUsers = usersWithPlan.length;
    const proUsers = usersWithPlan.filter((u: any) => u.isPro).length;
    const newThisMonth = usersWithPlan.filter((u: any) => new Date(u.created_at) >= thisMonth).length;
    const newLastMonth = usersWithPlan.filter((u: any) => {
      const d = new Date(u.created_at);
      return d >= lastMonth && d < thisMonth;
    }).length;
    const monthlyPro = usersWithPlan.filter((u: any) => u.isPro && u.plan_interval === 'month').length;
    const yearlyPro = usersWithPlan.filter((u: any) => u.isPro && u.plan_interval === 'year').length;
    const mrr = (monthlyPro * 109) + (yearlyPro * Math.round(999 / 12));

    return NextResponse.json({
      stats: { totalUsers, proUsers, freeUsers: totalUsers - proUsers, newThisMonth, newLastMonth, monthlyPro, yearlyPro, mrr },
      users: usersWithPlan.sort((a: any, b: any) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    });

  } catch (e: any) {
    console.error('Admin API error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');
    if (!(await verifyAdmin(token))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { action, userId, email, subId } = body;
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Delete user
    if (action === 'delete_user') {
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      if (error) throw error;
      return NextResponse.json({ success: true });
    }

    // Give Pro (create free Stripe subscription)
    if (action === 'give_pro') {
      const interval = body.interval || 'month'; // 'month' or 'year'
      
      // Find or create Stripe customer
      let customerId: string;
      const existing = await getStripe().customers.list({ email, limit: 1 });
      if (existing.data.length > 0) {
        customerId = existing.data[0].id;
      } else {
        const customer = await getStripe().customers.create({ email });
        customerId = customer.id;
      }

      // Create free subscription (100% off coupon)
      const coupon = await getStripe().coupons.create({
        percent_off: 100,
        duration: 'forever',
        name: 'Admin Grant'
      });

      const priceId = process.env.STRIPE_PRICE_ID!;
      const subscription = await getStripe().subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        discounts: [{ coupon: coupon.id }],
      });

      return NextResponse.json({ success: true, subId: subscription.id });
    }

    // Remove Pro (cancel subscription)
    if (action === 'remove_pro') {
      if (!subId) return NextResponse.json({ error: 'subId required' }, { status: 400 });
      await getStripe().subscriptions.cancel(subId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });

  } catch (e: any) {
    console.error('Admin POST error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
