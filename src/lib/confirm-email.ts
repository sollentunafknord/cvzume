// Kayıt doğrulama e-postası: link Supabase'ten (admin.generateLink type=signup), e-posta bizden (Resend,
// noreply@cvzume.com), kullanıcının dilinde. Linke tıklayan kişi doğrulanır ve otomatik giriş yapar.
type L = 'sv' | 'en' | 'es' | 'tr' | 'de'
const T: Record<L, { subject: string; title: (n: string) => string; text: string; button: string; note: string; ignore: string }> = {
  tr: { subject: "CVzume hesabınızı onaylayın", title: n => `Hoş geldiniz${n ? `, ${n}` : ''}! 👋`, text: "CVzume hesabınızı kullanmaya başlamak için e-posta adresinizi onaylayın. Düğmeye tıkladığınızda giriş yapmış olarak başvurunuza başlayabilirsiniz.", button: 'E-postamı onayla', note: 'Bu link 24 saat geçerlidir.', ignore: 'Bu kaydı siz yapmadıysanız bu e-postayı yok sayabilirsiniz; hesap onaylanmadan kullanılamaz.' },
  sv: { subject: 'Bekräfta ditt CVzume-konto', title: n => `Välkommen${n ? `, ${n}` : ''}! 👋`, text: 'Bekräfta din e-postadress för att börja använda ditt CVzume-konto. När du klickar på knappen loggas du in och kan börja med din ansökan.', button: 'Bekräfta min e-post', note: 'Länken gäller i 24 timmar.', ignore: 'Om det inte var du som registrerade dig kan du strunta i mejlet; kontot kan inte användas utan bekräftelse.' },
  en: { subject: 'Confirm your CVzume account', title: n => `Welcome${n ? `, ${n}` : ''}! 👋`, text: 'Confirm your email address to start using your CVzume account. When you click the button, you will be signed in and can start your application.', button: 'Confirm my email', note: 'This link is valid for 24 hours.', ignore: "If you didn't sign up, you can ignore this email; the account can't be used without confirmation." },
  es: { subject: 'Confirma tu cuenta de CVzume', title: n => `¡Bienvenido/a${n ? `, ${n}` : ''}! 👋`, text: 'Confirma tu correo electrónico para empezar a usar tu cuenta de CVzume. Al pulsar el botón iniciarás sesión y podrás empezar tu solicitud.', button: 'Confirmar mi correo', note: 'Este enlace es válido durante 24 horas.', ignore: 'Si no te has registrado tú, ignora este correo; la cuenta no se puede usar sin confirmación.' },
  de: { subject: 'Bestätigen Sie Ihr CVzume-Konto', title: n => `Willkommen${n ? `, ${n}` : ''}! 👋`, text: 'Bestätigen Sie Ihre E-Mail-Adresse, um Ihr CVzume-Konto zu nutzen. Nach dem Klick auf die Schaltfläche sind Sie angemeldet und können mit Ihrer Bewerbung beginnen.', button: 'E-Mail bestätigen', note: 'Der Link ist 24 Stunden gültig.', ignore: 'Wenn Sie sich nicht registriert haben, können Sie diese E-Mail ignorieren; das Konto kann ohne Bestätigung nicht genutzt werden.' },
}
const esc = (v: string) => v.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

export async function sendConfirmEmail(to: string, link: string, locale: string, firstName: string): Promise<boolean> {
  const l = (Object.keys(T) as L[]).includes(locale as L) ? (locale as L) : 'sv'
  const c = T[l]
  const name = esc(firstName.slice(0, 60))
  const html = `<!DOCTYPE html><html lang="${l}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F1F6F3;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F6F3;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#23343A;border-radius:16px 16px 0 0;padding:32px 48px;text-align:center;">
  <div style="font-size:26px;font-weight:700;color:white;"><img src="https://www.cvzume.com/brand/cvzume-mark-on-dark-96.png" width="40" height="40" alt="" style="display:inline-block;vertical-align:middle;margin-right:10px;border:0;"><span style="vertical-align:middle;">CVzume</span></div>
</td></tr>
<tr><td style="background:white;padding:44px 48px;border-radius:0 0 16px 16px;">
  <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#23343A;">${c.title(name)}</h1>
  <p style="margin:0 0 28px;font-size:16px;color:#4F6166;line-height:1.7;">${c.text}</p>
  <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr><td style="background:#3E7F6C;border-radius:999px;">
    <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:white;text-decoration:none;">${c.button}</a>
  </td></tr></table>
  <p style="margin:0 0 8px;font-size:14px;color:#7C8D90;line-height:1.6;">${c.note}</p>
  <p style="margin:0;font-size:14px;color:#7C8D90;line-height:1.6;">${c.ignore}</p>
</td></tr>
<tr><td style="padding:20px;text-align:center;font-size:12px;color:#7C8D90;">CVzume · cvzume.com</td></tr>
</table></td></tr></table></body></html>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: 'CVzume <noreply@cvzume.com>', reply_to: 'hello@cvzume.com', to: [to], subject: c.subject, html, text: `${c.title(firstName)}\n\n${c.text}\n\n${link}\n\n${c.note}\n${c.ignore}` }),
  }).catch(() => null)
  if (!res?.ok) console.error('confirm email failed', res?.status, await res?.text().catch(() => ''))
  return !!res?.ok
}
