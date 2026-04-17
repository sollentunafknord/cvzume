// src/app/api/email/subscription-confirmed/route.ts
import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = 'CVzume <noreply@cvzume.com>';

export async function POST(request: Request) {
  try {
    const { email, firstName, plan, nextBillingDate } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email gerekli' }, { status: 400 });

    const name = firstName || 'där';
    const planLabel = plan === 'yearly' ? 'Pro Årsplan' : 'Pro Månadsplan';
    const price = plan === 'yearly' ? '999 kr/år' : '109 kr/mån';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `Du är nu Pro! Välkommen till CVzume Pro ⚡`,
        html: `
<!DOCTYPE html>
<html lang="sv">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        
        <tr><td style="background:#0D1B2A;border-radius:16px 16px 0 0;padding:36px 48px;text-align:center;">
          <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:white;">CV<span style="color:#93C5FD;">zume</span></div>
          <div style="display:inline-block;background:#1A56DB;color:white;font-size:12px;font-weight:600;padding:4px 16px;border-radius:20px;margin-top:12px;">⚡ Pro</div>
        </td></tr>

        <tr><td style="background:white;padding:48px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0D1B2A;">Du är nu Pro, ${name}! 🎉</h1>
          <p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.7;">Tack för din prenumeration. Du har nu tillgång till alla Pro-funktioner.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#F0FDF4;border:1.5px solid #BBF7D0;border-radius:12px;padding:24px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#15803D;">Dina Pro-förmåner:</p>
              <p style="margin:0 0 8px;font-size:14px;color:#166534;">✅ Obegränsade CV-analyser</p>
              <p style="margin:0 0 8px;font-size:14px;color:#166534;">✅ Obegränsade personliga brev</p>
              <p style="margin:0 0 8px;font-size:14px;color:#166534;">✅ PDF-export i HD</p>
              <p style="margin:0 0 8px;font-size:14px;color:#166534;">✅ Prioriterad AI</p>
              <p style="margin:0;font-size:14px;color:#166534;">✅ Fullständigt arkiv</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;background:#F8FAFC;border-radius:12px;padding:0;">
            <tr><td style="padding:16px 20px;border-bottom:1px solid #E2E8F0;">
              <table width="100%"><tr>
                <td style="font-size:13px;color:#64748B;">Plan</td>
                <td style="font-size:13px;font-weight:600;color:#0D1B2A;text-align:right;">${planLabel}</td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:16px 20px;border-bottom:1px solid #E2E8F0;">
              <table width="100%"><tr>
                <td style="font-size:13px;color:#64748B;">Pris</td>
                <td style="font-size:13px;font-weight:600;color:#0D1B2A;text-align:right;">${price}</td>
              </tr></table>
            </td></tr>
            <tr><td style="padding:16px 20px;">
              <table width="100%"><tr>
                <td style="font-size:13px;color:#64748B;">Nästa faktura</td>
                <td style="font-size:13px;font-weight:600;color:#0D1B2A;text-align:right;">${nextBillingDate || '-'}</td>
              </tr></table>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td align="center">
              <a href="https://www.cvzume.com/dashboard.html" style="display:inline-block;background:#1A56DB;color:white;font-size:16px;font-weight:600;padding:16px 40px;border-radius:10px;text-decoration:none;">Gå till dashboard →</a>
            </td></tr>
          </table>

          <p style="margin:0;font-size:13px;color:#94A3B8;text-align:center;">Frågor? <a href="mailto:info@cvzume.com" style="color:#1A56DB;">info@cvzume.com</a></p>
        </td></tr>

        <tr><td style="padding:24px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94A3B8;">© 2026 CVzume · Byggd i Sverige 🇸🇪 · <a href="https://www.cvzume.com" style="color:#94A3B8;">www.cvzume.com</a></p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`
      })
    });

    if (!res.ok) throw new Error('Resend error: ' + await res.text());
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('Subscription email error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
