// Şifre sıfırlama e-postası: link Supabase'ten (admin.generateLink), e-posta bizden (Resend,
// noreply@cvzume.com), kullanıcının dilinde. Supabase'in kendi e-postası İngilizce, "powered by Supabase"
// ve saatte birkaç e-postayla sınırlıydı.
type L = 'sv' | 'en' | 'es' | 'tr' | 'de'
const T: Record<L, { subject: string; title: string; text: string; button: string; note: string; ignore: string }> = {
  tr: { subject: 'CVzume şifrenizi sıfırlayın', title: 'Şifrenizi sıfırlayın', text: 'CVzume hesabınız için şifre sıfırlama isteği aldık. Yeni şifrenizi belirlemek için aşağıdaki düğmeye tıklayın.', button: 'Yeni şifre belirleyin', note: 'Bu link 1 saat geçerlidir ve yalnızca bir kez kullanılabilir.', ignore: 'Bu isteği siz yapmadıysanız bu e-postayı yok sayabilirsiniz; şifreniz değişmez.' },
  sv: { subject: 'Återställ ditt lösenord för CVzume', title: 'Återställ ditt lösenord', text: 'Vi har fått en begäran om att återställa lösenordet för ditt CVzume-konto. Klicka på knappen nedan för att välja ett nytt lösenord.', button: 'Välj nytt lösenord', note: 'Länken gäller i 1 timme och kan bara användas en gång.', ignore: 'Om det inte var du som bad om detta kan du strunta i mejlet; ditt lösenord ändras inte.' },
  en: { subject: 'Reset your CVzume password', title: 'Reset your password', text: 'We received a request to reset the password for your CVzume account. Click the button below to choose a new password.', button: 'Choose a new password', note: 'This link is valid for 1 hour and can only be used once.', ignore: "If you didn't request this, you can ignore this email; your password won't change." },
  es: { subject: 'Restablece tu contraseña de CVzume', title: 'Restablece tu contraseña', text: 'Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de CVzume. Pulsa el botón de abajo para elegir una nueva.', button: 'Elegir nueva contraseña', note: 'Este enlace es válido durante 1 hora y solo se puede usar una vez.', ignore: 'Si no lo has pedido tú, ignora este correo; tu contraseña no cambiará.' },
  de: { subject: 'Setzen Sie Ihr CVzume-Passwort zurück', title: 'Passwort zurücksetzen', text: 'Wir haben eine Anfrage zum Zurücksetzen des Passworts für Ihr CVzume-Konto erhalten. Klicken Sie auf die Schaltfläche, um ein neues Passwort festzulegen.', button: 'Neues Passwort festlegen', note: 'Der Link ist 1 Stunde gültig und kann nur einmal verwendet werden.', ignore: 'Wenn Sie das nicht angefordert haben, können Sie diese E-Mail ignorieren; Ihr Passwort bleibt unverändert.' },
}

function html(c: (typeof T)[L], link: string, locale: L) {
  return `<!DOCTYPE html><html lang="${locale}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;padding:40px 20px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#23343A;border-radius:16px 16px 0 0;padding:32px 48px;text-align:center;">
  <div style="font-family:'Segoe UI',Arial,sans-serif;font-size:26px;font-weight:700;color:white;letter-spacing:-0.5px;"><img src="https://www.cvzume.com/brand/cvzume-mark-on-dark-96.png" width="40" height="40" alt="" style="display:inline-block;vertical-align:middle;margin-right:10px;border:0;"><span style="vertical-align:middle;">CV<span style="color:#A7D7C5;">zume</span></span></div>
</td></tr>
<tr><td style="background:white;padding:44px 48px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#23343A;">${c.title}</h1>
  <p style="margin:0 0 28px;font-size:16px;color:#475569;line-height:1.7;">${c.text}</p>
  <table cellpadding="0" cellspacing="0" style="margin:0 0 28px;"><tr><td style="background:#3E7F6C;border-radius:10px;">
    <a href="${link}" style="display:inline-block;padding:14px 28px;font-size:16px;font-weight:600;color:white;text-decoration:none;">${c.button}</a>
  </td></tr></table>
  <p style="margin:0 0 8px;font-size:14px;color:#64748B;line-height:1.6;">${c.note}</p>
  <p style="margin:0;font-size:14px;color:#64748B;line-height:1.6;">${c.ignore}</p>
</td></tr>
<tr><td style="padding:20px;text-align:center;font-size:12px;color:#94A3B8;">CVzume · cvzume.com</td></tr>
</table></td></tr></table></body></html>`
}

export async function sendResetEmail(to: string, link: string, locale: string): Promise<boolean> {
  const l = (Object.keys(T) as L[]).includes(locale as L) ? (locale as L) : 'sv'
  const c = T[l]
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
    body: JSON.stringify({ from: 'CVzume <noreply@cvzume.com>', reply_to: 'hello@cvzume.com', to: [to], subject: c.subject, html: html(c, link, l), text: `${c.title}\n\n${c.text}\n\n${link}\n\n${c.note}\n${c.ignore}` }),
  }).catch(() => null)
  if (!res?.ok) console.error('reset email failed', res?.status, await res?.text().catch(() => ''))
  return !!res?.ok
}
