// src/app/api/email/welcome/route.ts
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
        subject: `Välkommen till CVzume, ${name}! 🎉`,
        html: `
<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- HEADER -->
          <tr>
            <td style="background:#0D1B2A;border-radius:16px 16px 0 0;padding:36px 48px;text-align:center;">
              <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:white;letter-spacing:-0.5px;">
                CV<span style="color:#93C5FD;">zume</span>
              </div>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background:white;padding:48px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
              
              <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#0D1B2A;">
                Välkommen, ${name}! 👋
              </h1>
              
              <p style="margin:0 0 24px;font-size:16px;color:#475569;line-height:1.7;">
                Ditt konto är nu aktivt. Du är redo att skapa CV:n som faktiskt matchar jobben du söker — med hjälp av AI.
              </p>

              <!-- FEATURES -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#F8FAFC;border-radius:12px;padding:24px;">
                    <p style="margin:0 0 12px;font-size:14px;font-weight:700;color:#0D1B2A;">Vad du kan göra med CVzume:</p>
                    <p style="margin:0 0 8px;font-size:14px;color:#475569;">✅ Analysera jobbannonser med AI</p>
                    <p style="margin:0 0 8px;font-size:14px;color:#475569;">✅ Skapa anpassade CV:n på minuter</p>
                    <p style="margin:0 0 8px;font-size:14px;color:#475569;">✅ Generera personliga brev automatiskt</p>
                    <p style="margin:0;font-size:14px;color:#475569;">✅ Exportera som PDF</p>
                  </td>
                </tr>
              </table>

              <!-- FREE PLAN INFO -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td style="background:#FFF7ED;border:1.5px solid #FED7AA;border-radius:12px;padding:20px 24px;">
                    <p style="margin:0 0 6px;font-size:14px;font-weight:700;color:#C2410C;">Gratis plan</p>
                    <p style="margin:0;font-size:13px;color:#9A3412;">Du har 2 CV-analyser per månad. Uppgradera till Pro för obegränsat tillgång — från 109 kr/mån.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                <tr>
                  <td align="center">
                    <a href="https://www.cvzume.com/dashboard.html" 
                       style="display:inline-block;background:#1A56DB;color:white;font-size:16px;font-weight:600;padding:16px 40px;border-radius:10px;text-decoration:none;">
                      Gå till dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;font-size:13px;color:#94A3B8;text-align:center;">
                Har du frågor? Kontakta oss på 
                <a href="mailto:info@cvzume.com" style="color:#1A56DB;">info@cvzume.com</a>
              </p>

            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="padding:24px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#94A3B8;">
                © 2026 CVzume · Byggd i Sverige 🇸🇪<br>
                <a href="https://www.cvzume.com" style="color:#94A3B8;">www.cvzume.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error('Resend error: ' + err);
    }

    return NextResponse.json({ success: true });

  } catch (e: any) {
    console.error('Welcome email error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
