// src/app/api/email/usage-limit/route.ts
import { NextResponse } from 'next/server';

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const FROM_EMAIL = 'CVzume <noreply@cvzume.com>';

export async function POST(request: Request) {
  try {
    const { email, firstName } = await request.json();
    if (!email) return NextResponse.json({ error: 'Email gerekli' }, { status: 400 });

    const name = firstName || 'där';

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [email],
        subject: `Dina 2 gratis CV-analyser är använda — uppgradera till Pro`,
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
        </td></tr>

        <tr><td style="background:white;padding:48px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0D1B2A;">Dina 2 gratis CV-analyser är använda 📊</h1>
          <p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.7;">Hej ${name}! Med gratis-planen ingår 2 CV-analyser totalt. Du har nu använt båda. Uppgradera till Pro för att fortsätta utan begränsningar.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr><td style="background:#FFF7ED;border:1.5px solid #FED7AA;border-radius:12px;padding:20px 24px;">
              <p style="margin:0 0 4px;font-size:14px;font-weight:600;color:#C2410C;">Gratis-plan</p>
              <p style="margin:0;font-size:14px;color:#9A3412;line-height:1.6;">Du har använt dina 2 analyser. För att skapa fler CV:n och personliga brev behöver du uppgradera till Pro.</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td style="background:#EFF6FF;border:1.5px solid #BFDBFE;border-radius:12px;padding:24px;">
              <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#1E40AF;">Med Pro får du:</p>
              <p style="margin:0 0 8px;font-size:14px;color:#1E3A8A;">⚡ Obegränsade CV-analyser</p>
              <p style="margin:0 0 8px;font-size:14px;color:#1E3A8A;">⚡ Obegränsade personliga brev</p>
              <p style="margin:0 0 8px;font-size:14px;color:#1E3A8A;">⚡ PDF-export i HD</p>
              <p style="margin:0 0 16px;font-size:14px;color:#1E3A8A;">⚡ Prioriterad AI</p>
              <p style="margin:0;font-size:14px;font-weight:600;color:#1E40AF;">Från 109 kr/mån · Avsluta när som helst</p>
            </td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
            <tr><td align="center">
              <a href="https://www.cvzume.com/uppgradera.html" style="display:inline-block;background:#1A56DB;color:white;font-size:16px;font-weight:600;padding:16px 40px;border-radius:10px;text-decoration:none;">Uppgradera till Pro →</a>
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
    console.error('Usage limit email error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
