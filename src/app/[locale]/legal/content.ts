// Juridiska sidor. Svenska är originalet; övriga språk visar den engelska versionen.
// Uppdatera UPDATED när innehållet ändras.

export const UPDATED = '2026-10-30';
export const CONTACT = 'info@cvzume.com';

export type LegalSlug = 'privacy' | 'cookies' | 'terms';
export type Section = { h: string; p: string[] };
export type LegalDoc = { title: string; lead: string; sections: Section[] };

const sv: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: 'Integritetspolicy',
    lead: 'Här beskriver vi vilka personuppgifter CVzume behandlar, varför, och vilka rättigheter du har enligt dataskyddsförordningen (GDPR).',
    sections: [
      { h: 'Personuppgiftsansvarig', p: [`CVzume är personuppgiftsansvarig för behandlingen av dina uppgifter. Du når oss på ${CONTACT}.`] },
      { h: 'Vilka uppgifter vi behandlar', p: [
        'Kontouppgifter: namn, e-postadress och lösenord (lösenordet lagras krypterat av vår inloggningstjänst).',
        'Profil och CV: de uppgifter du själv fyller i eller laddar upp, till exempel arbetslivserfarenhet, utbildning, kompetenser, språk och profilbild.',
        'Ansökningar: jobbannonser du klistrar in eller sparar, genererade CV-texter och personliga brev, status på dina ansökningar och sparade favoritjobb.',
        'Betalning: om du köper Pro hanterar Stripe dina kortuppgifter. Vi får bara veta e-postadress, vilken plan du har och om betalningen gått igenom.',
        'Teknisk information: anonym besöksstatistik (Vercel Web Analytics, utan cookies) och serverloggar som behövs för att driva tjänsten säkert.',
      ] },
      { h: 'Varför vi behandlar uppgifterna', p: [
        'För att leverera tjänsten du har bett om — skapa och spara CV, brev och ansökningar (rättslig grund: avtal).',
        'För att hantera betalningar och bokföring (avtal och rättslig förpliktelse).',
        'För att skicka nödvändiga e-postmeddelanden om ditt konto och din prenumeration (avtal).',
        'För att förhindra missbruk, till exempel att samma e-postadress registreras om och om igen för gratis användning. När du raderar ditt konto sparar vi därför en envägs-hash av e-postadressen, inte själva adressen (berättigat intresse).',
      ] },
      { h: 'AI-bearbetning', p: [
        'När du analyserar en annons skickas annonsen och relevanta delar av din profil till en AI-leverantör som genererar texten. Vi använder i första hand Google (Gemini) och som reserv Groq och OpenRouter. Dessa leverantörer kan behandla uppgifterna utanför EU/EES, bland annat i USA. Överföringen sker med stöd av EU-kommissionens standardavtalsklausuler eller EU–US Data Privacy Framework.',
        'Undvik att skriva in känsliga uppgifter (till exempel hälsa, religion eller personnummer) i din profil eller i fritextfält.',
        'Testverktyget på startsidan fungerar utan konto. Texten du skriver där skickas till AI-leverantören men sparas inte hos oss. För att förhindra missbruk räknar vi antalet tester per IP-adress i högst 24 timmar.',
      ] },
      { h: 'Var uppgifterna lagras', p: [
        'Databas, inloggning och filer lagras hos Supabase i EU (Irland). Webbplatsen drivs av Vercel. E-post skickas via Resend och betalningar hanteras av Stripe. Alla leverantörer är personuppgiftsbiträden med avtal som reglerar hur de får använda uppgifterna.',
      ] },
      { h: 'Hur länge vi sparar uppgifterna', p: [
        'Vi sparar dina uppgifter så länge du har ett konto. Du kan när som helst radera kontot under Inställningar → Konto; då raderas profil, CV, ansökningar och favoriter. Uppgifter som vi enligt bokföringslagen måste spara (till exempel kvitton) sparas hos Stripe i sju år.',
      ] },
      { h: 'Dina rättigheter', p: [
        'Du har rätt att begära tillgång till, rättelse av, radering av och flytt av dina uppgifter, samt att invända mot eller begära begränsning av behandling. Kontakta oss på ' + CONTACT + '.',
        'Om du anser att vi behandlar dina uppgifter felaktigt kan du lämna klagomål till Integritetsskyddsmyndigheten (IMY), imy.se.',
      ] },
    ],
  },
  cookies: {
    title: 'Cookies',
    lead: 'CVzume använder inga cookies för reklam eller spårning. Här är det som faktiskt sparas i din webbläsare.',
    sections: [
      { h: 'Nödvändiga cookies och lagring', p: [
        'NEXT_LOCALE — kommer ihåg vilket språk du har valt (1 år).',
        'Lokal lagring (localStorage) — håller dig inloggad och sparar inställningar som valt språk och utkast. Den lämnar aldrig din webbläsare och rensas när du loggar ut.',
      ] },
      { h: 'Besöksstatistik', p: [
        'Vi använder Vercel Web Analytics för anonym statistik över sidvisningar. Den använder inga cookies och identifierar inte enskilda besökare.',
      ] },
      { h: 'Betalning', p: [
        'När du betalar för Pro skickas du till Stripe, som kan sätta egna cookies för att förhindra bedrägerier. Läs mer i Stripes integritetspolicy.',
      ] },
      { h: 'Samtycke', p: [
        'Eftersom vi bara använder lagring som är nödvändig för att tjänsten ska fungera behöver vi inget cookie-samtycke enligt lagen om elektronisk kommunikation. Om vi någon gång lägger till cookies som inte är nödvändiga kommer vi att be om ditt samtycke först.',
      ] },
    ],
  },
  terms: {
    title: 'Användarvillkor',
    lead: 'Dessa villkor gäller när du använder CVzume. Genom att skapa ett konto godkänner du dem.',
    sections: [
      { h: 'Tjänsten', p: [
        'CVzume är ett verktyg som hjälper dig att skapa CV, personliga brev och förbereda jobbansökningar med hjälp av AI. Vi garanterar inte att du får något jobb, och tjänsten kan ibland vara otillgänglig på grund av underhåll eller fel hos våra leverantörer.',
      ] },
      { h: 'Ditt ansvar', p: [
        'Du ansvarar för att uppgifterna i ditt CV och dina ansökningar är sanna. AI-genererad text kan innehålla fel — läs alltid igenom och rätta texten innan du skickar den till en arbetsgivare.',
        'Du får inte använda tjänsten för att skapa vilseledande, olagligt eller kränkande innehåll, eller försöka kringgå begränsningar som användningsgränser.',
        'Du ansvarar för att hålla ditt lösenord hemligt.',
      ] },
      { h: 'Gratis och Pro', p: [
        'Gratiskontot innehåller ett begränsat antal AI-genereringar per månad. Pro ger obegränsad användning enligt prisinformationen på webbplatsen.',
        'Pro betalas i förskott per månad eller per år via Stripe och förnyas automatiskt tills du avslutar. Det finns ingen bindningstid. Vill du avsluta, mejla ' + CONTACT + ' så avslutar vi prenumerationen till slutet av den betalda perioden. Betalda perioder återbetalas inte i efterhand.',
        'Ångerrätt: Enligt distansavtalslagen har du 14 dagars ångerrätt från köpet. Mejla ' + CONTACT + ' om du vill ångra dig. Har du redan använt tjänsten under perioden kan vi dra av en skälig del av priset.',
        'Vi kan ändra priser. Ändringar gäller från nästa betalningsperiod och meddelas i god tid via e-post.',
      ] },
      { h: 'Innehåll', p: [
        'Du äger det du skriver och de texter som genereras åt dig. Du ger oss rätt att lagra och bearbeta innehållet i den utsträckning som krävs för att leverera tjänsten.',
      ] },
      { h: 'Ansvarsbegränsning', p: [
        'Tjänsten tillhandahålls i befintligt skick. Vi ansvarar inte för indirekta skador eller förlorade arbetstillfällen. Vårt sammanlagda ansvar är begränsat till det belopp du har betalat till oss de senaste tolv månaderna. Detta begränsar inte dina rättigheter enligt tvingande konsumentlagstiftning.',
      ] },
      { h: 'Avsluta konto', p: [
        'Du kan radera ditt konto när som helst under Inställningar. Vi kan stänga av konton som bryter mot dessa villkor.',
      ] },
      { h: 'Ändringar och tvister', p: [
        'Vi kan uppdatera villkoren. Väsentliga ändringar meddelas via e-post eller i appen. Svensk lag gäller. Som konsument kan du vända dig till Allmänna reklamationsnämnden (ARN) eller EU:s plattform för tvistlösning online.',
      ] },
    ],
  },
};

const en: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: 'Privacy policy',
    lead: 'This page explains what personal data CVzume processes, why, and what rights you have under the General Data Protection Regulation (GDPR). The Swedish version is the original.',
    sections: [
      { h: 'Data controller', p: [`CVzume is the controller of your personal data. You can reach us at ${CONTACT}.`] },
      { h: 'What data we process', p: [
        'Account data: name, email address and password (the password is stored encrypted by our authentication provider).',
        'Profile and CV: the information you enter or upload, such as work experience, education, skills, languages and profile photo.',
        'Applications: job ads you paste or save, generated CV texts and cover letters, application status and saved favourite jobs.',
        'Payment: if you buy Pro, Stripe handles your card details. We only learn your email address, your plan and whether the payment succeeded.',
        'Technical information: anonymous visitor statistics (Vercel Web Analytics, without cookies) and server logs needed to run the service securely.',
      ] },
      { h: 'Why we process it', p: [
        'To provide the service you asked for — creating and saving CVs, letters and applications (legal basis: contract).',
        'To handle payments and bookkeeping (contract and legal obligation).',
        'To send necessary emails about your account and subscription (contract).',
        'To prevent abuse, such as the same email address being registered repeatedly for free use. When you delete your account we therefore keep a one-way hash of the email address, not the address itself (legitimate interest).',
      ] },
      { h: 'AI processing', p: [
        'When you analyse a job ad, the ad and relevant parts of your profile are sent to an AI provider that generates the text. We primarily use Google (Gemini), with Groq and OpenRouter as fallbacks. These providers may process data outside the EU/EEA, including in the USA. Transfers rely on the European Commission\'s Standard Contractual Clauses or the EU–US Data Privacy Framework.',
        'Please avoid entering sensitive data (for example health, religion or personal identity numbers) in your profile or free-text fields.',
        'The try-it tool on the home page works without an account. The text you enter there is sent to the AI provider but not stored by us. To prevent abuse we count the number of tries per IP address for at most 24 hours.',
      ] },
      { h: 'Where data is stored', p: [
        'Database, authentication and files are stored with Supabase in the EU (Ireland). The website runs on Vercel. Email is sent via Resend and payments are handled by Stripe. All providers are processors bound by agreements governing how they may use the data.',
      ] },
      { h: 'How long we keep data', p: [
        'We keep your data for as long as you have an account. You can delete your account at any time under Settings → Account; this deletes your profile, CV, applications and favourites. Data we must keep under Swedish bookkeeping law (such as receipts) is kept by Stripe for seven years.',
      ] },
      { h: 'Your rights', p: [
        'You have the right to request access to, rectification, erasure and portability of your data, and to object to or request restriction of processing. Contact us at ' + CONTACT + '.',
        'If you believe we process your data incorrectly, you can lodge a complaint with the Swedish Authority for Privacy Protection (IMY), imy.se.',
      ] },
    ],
  },
  cookies: {
    title: 'Cookies',
    lead: 'CVzume does not use cookies for advertising or tracking. This is what is actually stored in your browser.',
    sections: [
      { h: 'Necessary cookies and storage', p: [
        'NEXT_LOCALE — remembers the language you chose (1 year).',
        'Local storage (localStorage) — keeps you logged in and stores settings such as your language and drafts. It never leaves your browser and is cleared when you log out.',
      ] },
      { h: 'Visitor statistics', p: [
        'We use Vercel Web Analytics for anonymous page-view statistics. It uses no cookies and does not identify individual visitors.',
      ] },
      { h: 'Payment', p: [
        'When you pay for Pro you are sent to Stripe, which may set its own cookies to prevent fraud. See Stripe\'s privacy policy for details.',
      ] },
      { h: 'Consent', p: [
        'Because we only use storage that is necessary for the service to work, no cookie consent is required under Swedish law. If we ever add non-essential cookies, we will ask for your consent first.',
      ] },
    ],
  },
  terms: {
    title: 'Terms of use',
    lead: 'These terms apply when you use CVzume. By creating an account you accept them. The Swedish version is the original.',
    sections: [
      { h: 'The service', p: [
        'CVzume is a tool that helps you create CVs and cover letters and prepare job applications with the help of AI. We do not guarantee that you will get a job, and the service may occasionally be unavailable due to maintenance or issues with our providers.',
      ] },
      { h: 'Your responsibility', p: [
        'You are responsible for the information in your CV and applications being true. AI-generated text can contain errors — always read through and correct the text before sending it to an employer.',
        'You may not use the service to create misleading, illegal or offensive content, or try to circumvent limits such as usage caps.',
        'You are responsible for keeping your password secret.',
      ] },
      { h: 'Free and Pro', p: [
        'The free account includes a limited number of AI generations per month. Pro gives unlimited use according to the pricing on the website.',
        'Pro is paid in advance monthly or yearly via Stripe and renews automatically until you cancel. There is no lock-in period. To cancel, email ' + CONTACT + ' and we will end the subscription at the end of the paid period. Paid periods are not refunded retroactively.',
        'Right of withdrawal: under the Swedish Distance Contracts Act you have a 14-day right of withdrawal from the purchase. Email ' + CONTACT + ' if you want to withdraw. If you have already used the service during that time, we may deduct a reasonable part of the price.',
        'We may change prices. Changes apply from the next billing period and are announced in advance by email.',
      ] },
      { h: 'Content', p: [
        'You own what you write and the texts generated for you. You give us the right to store and process the content to the extent needed to provide the service.',
      ] },
      { h: 'Limitation of liability', p: [
        'The service is provided as is. We are not liable for indirect damages or lost job opportunities. Our total liability is limited to the amount you have paid us in the last twelve months. This does not limit your rights under mandatory consumer law.',
      ] },
      { h: 'Closing your account', p: [
        'You can delete your account at any time under Settings. We may suspend accounts that violate these terms.',
      ] },
      { h: 'Changes and disputes', p: [
        'We may update these terms. Material changes are announced by email or in the app. Swedish law applies. As a consumer you can turn to the Swedish National Board for Consumer Disputes (ARN) or the EU Online Dispute Resolution platform.',
      ] },
    ],
  },
};

export function getLegal(locale: string, slug: LegalSlug): LegalDoc {
  return (locale === 'sv' ? sv : en)[slug];
}

export const SLUGS: LegalSlug[] = ['privacy', 'cookies', 'terms'];
