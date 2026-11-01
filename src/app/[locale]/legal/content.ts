// Juridiska sidor. Svenska är originalet; en/tr/es/de är översättningar (formellt tilltal på turkiska och tyska).
// Uppdatera UPDATED när innehållet ändras.

export const UPDATED = '2026-11-01';
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
        'Teknisk information: anonym besöksstatistik (Vercel Web Analytics, utan cookies) och serverloggar som behövs för att driva tjänsten säkert. Om du godkänner statistikcookies använder vi även Google Analytics (se Cookies).',
      ] },
      { h: 'Varför vi behandlar uppgifterna', p: [
        'För att leverera tjänsten du har bett om — skapa och spara CV, brev och ansökningar (rättslig grund: avtal).',
        'För att hantera betalningar och bokföring (avtal och rättslig förpliktelse).',
        'För att skicka nödvändiga e-postmeddelanden om ditt konto och din prenumeration (avtal).',
        'För att förhindra missbruk, till exempel att samma e-postadress registreras om och om igen för gratis användning. När du raderar ditt konto sparar vi därför en envägs-hash av e-postadressen, inte själva adressen (berättigat intresse).',
      ] },
      { h: 'AI-bearbetning', p: [
        'När du analyserar en annons skickas annonsen och relevanta delar av din profil till en AI-leverantör som genererar texten. Vi använder i första hand Groq och som reserv Google (Gemini) och OpenRouter. Dessa leverantörer kan behandla uppgifterna utanför EU/EES, bland annat i USA. Överföringen sker med stöd av EU-kommissionens standardavtalsklausuler eller EU–US Data Privacy Framework.',
        'Undvik att skriva in känsliga uppgifter (till exempel hälsa, religion eller personnummer) i din profil eller i fritextfält.',
        'Testverktyget på startsidan fungerar utan konto. Texten du skriver där skickas till AI-leverantören men sparas inte hos oss. För att förhindra missbruk räknar vi antalet tester per IP-adress. Vi sparar bara en envägs-hash av IP-adressen, aldrig själva adressen, och raderar den efter högst två dygn.',
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
    lead: 'CVzume använder inga cookies för reklam. Statistikcookies från Google Analytics sätts bara om du godkänner dem. Här är det som sparas i din webbläsare.',
    sections: [
      { h: 'Nödvändiga cookies och lagring', p: [
        'NEXT_LOCALE — kommer ihåg vilket språk du har valt (1 år).',
        'cvz_country — vilket land du besöker oss från, enligt din IP-adress (30 dagar). Används för att visa rätt innehåll och rätt jobbkälla, till exempel Platsbanken i Sverige.',
        'Lokal lagring (localStorage) — håller dig inloggad och sparar inställningar som valt språk och utkast. Den lämnar aldrig din webbläsare och rensas när du loggar ut.',
      ] },
      { h: 'Besöksstatistik', p: [
        'Vi använder Vercel Web Analytics för anonym statistik över sidvisningar. Den använder inga cookies och identifierar inte enskilda besökare.',
        'Om du godkänner i cookie-rutan använder vi även Google Analytics för att förstå hur sidan används. Det sätter cookies (_ga, _ga_*, upp till 14 månader). IP-adresser lagras inte, och Googles reklamfunktioner (Google-signaler och annonsanpassning) är avstängda. Google Ireland behandlar uppgifterna för vår räkning; viss överföring till USA kan ske enligt EU-U.S. Data Privacy Framework.',
      ] },
      { h: 'Betalning', p: [
        'När du betalar för Pro skickas du till Stripe, som kan sätta egna cookies för att förhindra bedrägerier. Läs mer i Stripes integritetspolicy.',
      ] },
      { h: 'Samtycke', p: [
        'Statistikcookies från Google Analytics sätts bara efter att du har klickat på ”Godkänn” i cookie-rutan. Avböjer du laddas Google Analytics inte alls. Du kan ändra ditt val när som helst via länken ”Cookie-inställningar” längst ner på sidan. Övrig lagring ovan är nödvändig för att tjänsten ska fungera och kräver inget samtycke.',
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
        'Pro betalas i förskott per månad eller per år via Stripe och förnyas automatiskt tills du avslutar. Det finns ingen bindningstid. Du avslutar själv under Inställningar → Plan → Hantera prenumeration; Pro gäller då till slutet av den betalda perioden. Betalda perioder återbetalas inte i efterhand.',
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
        'Applications: job ads you paste or save, generated CV texts and cover letters, application status and saved favorite jobs.',
        'Payment: if you buy Pro, Stripe handles your card details. We only learn your email address, your plan and whether the payment succeeded.',
        'Technical information: anonymous visitor statistics (Vercel Web Analytics, without cookies) and server logs needed to run the service securely. If you accept statistics cookies, we also use Google Analytics (see Cookies).',
      ] },
      { h: 'Why we process it', p: [
        'To provide the service you asked for — creating and saving CVs, letters and applications (legal basis: contract).',
        'To handle payments and bookkeeping (contract and legal obligation).',
        'To send necessary emails about your account and subscription (contract).',
        'To prevent abuse, such as the same email address being registered repeatedly for free use. When you delete your account we therefore keep a one-way hash of the email address, not the address itself (legitimate interest).',
      ] },
      { h: 'AI processing', p: [
        'When you analyze a job ad, the ad and relevant parts of your profile are sent to an AI provider that generates the text. We primarily use Groq, with Google (Gemini) and OpenRouter as fallbacks. These providers may process data outside the EU/EEA, including in the USA. Transfers rely on the European Commission\'s Standard Contractual Clauses or the EU–US Data Privacy Framework.',
        'Please avoid entering sensitive data (for example health, religion or personal identity numbers) in your profile or free-text fields.',
        'The try-it tool on the home page works without an account. The text you enter there is sent to the AI provider but not stored by us. To prevent abuse we count the number of tries per IP address. We only store a one-way hash of the IP address, never the address itself, and delete it after at most two days.',
      ] },
      { h: 'Where data is stored', p: [
        'Database, authentication and files are stored with Supabase in the EU (Ireland). The website runs on Vercel. Email is sent via Resend and payments are handled by Stripe. All providers are processors bound by agreements governing how they may use the data.',
      ] },
      { h: 'How long we keep data', p: [
        'We keep your data for as long as you have an account. You can delete your account at any time under Settings → Account; this deletes your profile, CV, applications and favorites. Data we must keep under Swedish bookkeeping law (such as receipts) is kept by Stripe for seven years.',
      ] },
      { h: 'Your rights', p: [
        'You have the right to request access to, rectification, erasure and portability of your data, and to object to or request restriction of processing. Contact us at ' + CONTACT + '.',
        'If you believe we process your data incorrectly, you can lodge a complaint with the Swedish Authority for Privacy Protection (IMY), imy.se.',
      ] },
    ],
  },
  cookies: {
    title: 'Cookies',
    lead: 'CVzume does not use advertising cookies. Statistics cookies from Google Analytics are set only if you accept them. This is what is stored in your browser.',
    sections: [
      { h: 'Necessary cookies and storage', p: [
        'NEXT_LOCALE — remembers the language you chose (1 year).',
        'cvz_country — the country you visit from, based on your IP address (30 days). Used to show the right content and job source, for example Platsbanken in Sweden.',
        'Local storage (localStorage) — keeps you logged in and stores settings such as your language and drafts. It never leaves your browser and is cleared when you log out.',
      ] },
      { h: 'Visitor statistics', p: [
        'We use Vercel Web Analytics for anonymous page-view statistics. It uses no cookies and does not identify individual visitors.',
        'If you accept in the cookie banner, we also use Google Analytics to understand how the site is used. It sets cookies (_ga, _ga_*, up to 14 months). IP addresses are not stored, and Google\'s advertising features (Google signals and ad personalization) are turned off. Google Ireland processes the data on our behalf; some transfer to the US may take place under the EU-U.S. Data Privacy Framework.',
      ] },
      { h: 'Payment', p: [
        'When you pay for Pro you are sent to Stripe, which may set its own cookies to prevent fraud. See Stripe\'s privacy policy for details.',
      ] },
      { h: 'Consent', p: [
        'Statistics cookies from Google Analytics are set only after you click “Accept” in the cookie banner. If you decline, Google Analytics is not loaded at all. You can change your choice at any time via the “Cookie settings” link at the bottom of the page. The other storage above is necessary for the service to work and needs no consent.',
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
        'Pro is paid in advance monthly or yearly via Stripe and renews automatically until you cancel. There is no lock-in period. You cancel yourself under Settings → Plan → Manage subscription; Pro then stays active until the end of the paid period. Paid periods are not refunded retroactively.',
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


const tr: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: 'Gizlilik politikası',
    lead: 'Bu sayfada CVzume\'un hangi kişisel verilerinizi, neden işlediğini ve Genel Veri Koruma Tüzüğü (GDPR) ile Kişisel Verilerin Korunması Kanunu (KVKK) kapsamındaki haklarınızı açıklıyoruz. Asıl metin İsveççedir.',
    sections: [
      { h: 'Veri sorumlusu', p: [`Kişisel verilerinizin işlenmesinden CVzume sorumludur. Bize ${CONTACT} adresinden ulaşabilirsiniz.`] },
      { h: 'Hangi verileri işliyoruz', p: [
        'Hesap bilgileri: ad, e-posta adresi ve şifre (şifre, giriş hizmeti sağlayıcımız tarafından şifrelenmiş olarak saklanır).',
        'Profil ve CV: iş deneyimi, eğitim, yetkinlikler, diller ve profil fotoğrafı gibi kendi girdiğiniz ya da yüklediğiniz bilgiler.',
        'Başvurular: yapıştırdığınız ya da kaydettiğiniz iş ilanları, oluşturulan CV metinleri ve ön yazılar, başvurularınızın durumu ve favori ilanlarınız.',
        'Ödeme: Pro satın alırsanız kart bilgilerinizi Stripe işler. Biz yalnızca e-posta adresinizi, planınızı ve ödemenin başarılı olup olmadığını öğreniriz.',
        'Teknik bilgiler: anonim ziyaret istatistikleri (çerezsiz Vercel Web Analytics) ve hizmeti güvenli şekilde sunmak için gereken sunucu kayıtları. İstatistik çerezlerini kabul ederseniz Google Analytics de kullanırız (bkz. Çerezler).',
      ] },
      { h: 'Verileri neden işliyoruz', p: [
        'Talep ettiğiniz hizmeti sunmak için — CV, ön yazı ve başvuru oluşturmak ve kaydetmek (hukuki dayanak: sözleşme).',
        'Ödemeleri ve muhasebeyi yürütmek için (sözleşme ve yasal yükümlülük).',
        'Hesabınız ve aboneliğinizle ilgili gerekli e-postaları göndermek için (sözleşme).',
        'Kötüye kullanımı önlemek için; örneğin aynı e-posta adresinin ücretsiz kullanım için tekrar tekrar kaydedilmesini engellemek. Bu nedenle hesabınızı sildiğinizde e-posta adresinizin kendisini değil, yalnızca tek yönlü bir özetini (hash) saklarız (meşru menfaat).',
      ] },
      { h: 'Yapay zeka ile işleme', p: [
        'Bir ilanı analiz ettiğinizde ilan ve profilinizin ilgili bölümleri, metni üreten bir yapay zeka sağlayıcısına gönderilir. Öncelikle Groq\'u, yedek olarak Google (Gemini) ve OpenRouter\'ı kullanıyoruz. Bu sağlayıcılar verileri AB/AEA dışında, örneğin ABD\'de işleyebilir. Aktarım, Avrupa Komisyonu\'nun standart sözleşme maddelerine veya AB–ABD Veri Gizliliği Çerçevesi\'ne dayanır.',
        'Lütfen profilinize veya serbest metin alanlarına hassas veriler (örneğin sağlık, din veya T.C. kimlik numarası) yazmayın.',
        'Ana sayfadaki deneme aracı hesap olmadan çalışır. Oraya yazdığınız metin yapay zeka sağlayıcısına gönderilir ancak bizde saklanmaz. Kötüye kullanımı önlemek için IP adresi başına deneme sayısını sayarız; IP adresinin kendisini değil yalnızca tek yönlü özetini saklar ve en geç iki gün içinde sileriz.',
      ] },
      { h: 'Veriler nerede saklanıyor', p: [
        'Veritabanı, giriş sistemi ve dosyalar AB\'de (İrlanda) Supabase üzerinde saklanır. Web sitesi Vercel üzerinde çalışır. E-postalar Resend ile gönderilir, ödemeler Stripe tarafından işlenir. Tüm sağlayıcılar, verileri nasıl kullanabileceklerini düzenleyen sözleşmelere tabi veri işleyenlerdir.',
      ] },
      { h: 'Verileri ne kadar süre saklıyoruz', p: [
        'Verilerinizi hesabınız olduğu sürece saklarız. Hesabınızı istediğiniz zaman Ayarlar → Hesap bölümünden silebilirsiniz; bu durumda profiliniz, CV\'niz, başvurularınız ve favorileriniz silinir. İsveç muhasebe mevzuatı gereği saklanması zorunlu bilgiler (örneğin makbuzlar) Stripe tarafından yedi yıl saklanır.',
      ] },
      { h: 'Haklarınız', p: [
        'Verilerinize erişim, düzeltme, silme ve taşıma talep etme; işlemeye itiraz etme veya işlemenin kısıtlanmasını isteme hakkına sahipsiniz. Türkiye\'de bulunan kullanıcılar KVKK madde 11 kapsamındaki haklarını da aynı yoldan kullanabilir. Bize ' + CONTACT + ' adresinden yazın.',
        'Verilerinizin hatalı işlendiğini düşünüyorsanız İsveç Veri Koruma Kurumu\'na (IMY, imy.se) ya da Türkiye\'de Kişisel Verileri Koruma Kurumu\'na (kvkk.gov.tr) şikâyette bulunabilirsiniz.',
      ] },
    ],
  },
  cookies: {
    title: 'Çerezler',
    lead: 'CVzume reklam çerezi kullanmaz. Google Analytics istatistik çerezleri yalnızca siz kabul ederseniz yerleştirilir. Tarayıcınızda saklananlar şunlardır.',
    sections: [
      { h: 'Zorunlu çerezler ve depolama', p: [
        'NEXT_LOCALE — seçtiğiniz dili hatırlar (1 yıl).',
        'cvz_country — IP adresinize göre bizi hangi ülkeden ziyaret ettiğiniz (30 gün). Doğru içeriği ve doğru iş kaynağını göstermek için kullanılır; örneğin Türkiye\'de İŞKUR.',
        'Yerel depolama (localStorage) — oturumunuzu açık tutar, dil tercihi ve taslaklar gibi ayarları saklar. Tarayıcınızdan hiç çıkmaz ve çıkış yaptığınızda temizlenir.',
      ] },
      { h: 'Ziyaret istatistikleri', p: [
        'Sayfa görüntülemelerine ait anonim istatistikler için Vercel Web Analytics kullanıyoruz. Çerez kullanmaz ve ziyaretçileri tek tek tanımlamaz.',
        'Çerez kutusunda kabul ederseniz sitenin nasıl kullanıldığını anlamak için Google Analytics de kullanırız. Bu, çerezler yerleştirir (_ga, _ga_*, en fazla 14 ay). IP adresleri saklanmaz ve Google\'ın reklam özellikleri (Google sinyalleri ve reklam kişiselleştirme) kapalıdır. Veriler bizim adımıza Google Ireland tarafından işlenir; bir kısmı AB-ABD Veri Gizliliği Çerçevesi kapsamında ABD\'ye aktarılabilir.',
      ] },
      { h: 'Ödeme', p: [
        'Pro için ödeme yaptığınızda Stripe\'a yönlendirilirsiniz; Stripe dolandırıcılığı önlemek için kendi çerezlerini kullanabilir. Ayrıntılar için Stripe\'ın gizlilik politikasına bakın.',
      ] },
      { h: 'Onay', p: [
        'Google Analytics istatistik çerezleri yalnızca çerez kutusunda “Kabul et”e tıkladıktan sonra yerleştirilir. Reddederseniz Google Analytics hiç yüklenmez. Seçiminizi sayfanın altındaki “Çerez ayarları” bağlantısından istediğiniz zaman değiştirebilirsiniz. Yukarıdaki diğer depolama hizmetin çalışması için zorunludur ve onay gerektirmez.',
      ] },
    ],
  },
  terms: {
    title: 'Kullanım koşulları',
    lead: 'Bu koşullar CVzume\'u kullandığınızda geçerlidir. Hesap oluşturarak bu koşulları kabul etmiş olursunuz. Asıl metin İsveççedir.',
    sections: [
      { h: 'Hizmet', p: [
        'CVzume, yapay zeka yardımıyla CV ve ön yazı oluşturmanıza ve iş başvurularına hazırlanmanıza yardımcı olan bir araçtır. İş bulacağınızı garanti etmeyiz; hizmet bakım veya sağlayıcılarımızdaki arızalar nedeniyle zaman zaman kullanılamayabilir.',
      ] },
      { h: 'Sorumluluğunuz', p: [
        'CV\'nizdeki ve başvurularınızdaki bilgilerin doğru olmasından siz sorumlusunuz. Yapay zekanın ürettiği metinde hatalar olabilir — işverene göndermeden önce metni mutlaka okuyun ve düzeltin.',
        'Hizmeti yanıltıcı, yasa dışı veya saldırgan içerik üretmek ya da kullanım sınırları gibi kısıtlamaları aşmaya çalışmak için kullanamazsınız.',
        'Şifrenizi gizli tutmaktan siz sorumlusunuz.',
      ] },
      { h: 'Ücretsiz plan ve Pro', p: [
        'Ücretsiz hesap ayda sınırlı sayıda yapay zeka üretimi içerir. Pro, web sitesindeki fiyat bilgilerine göre sınırsız kullanım sunar.',
        'Pro, Stripe üzerinden aylık veya yıllık olarak peşin ödenir ve siz iptal edene kadar otomatik olarak yenilenir. Taahhüt yoktur. İptali kendiniz Ayarlar → Plan → Aboneliği yönet bölümünden yaparsınız; Pro, ödenmiş dönemin sonuna kadar geçerli kalır. Ödenmiş dönemler geriye dönük iade edilmez.',
        'Cayma hakkı: İsveç mesafeli sözleşmeler mevzuatı uyarınca satın alma tarihinden itibaren 14 gün cayma hakkınız vardır. Cayma için ' + CONTACT + ' adresine yazın. Bu süre içinde hizmeti kullandıysanız bedelin makul bir kısmını düşebiliriz.',
        'Fiyatları değiştirebiliriz. Değişiklikler bir sonraki ödeme döneminden itibaren geçerli olur ve önceden e-postayla bildirilir.',
      ] },
      { h: 'İçerik', p: [
        'Yazdıklarınız ve sizin için üretilen metinler size aittir. Hizmeti sunmak için gerekli olduğu ölçüde içeriği saklama ve işleme hakkını bize verirsiniz.',
      ] },
      { h: 'Sorumluluğun sınırlandırılması', p: [
        'Hizmet "olduğu gibi" sunulur. Dolaylı zararlardan veya kaçırılan iş fırsatlarından sorumlu değiliz. Toplam sorumluluğumuz, son on iki ayda bize ödediğiniz tutarla sınırlıdır. Bu, emredici tüketici mevzuatından doğan haklarınızı sınırlamaz.',
      ] },
      { h: 'Hesabın kapatılması', p: [
        'Hesabınızı istediğiniz zaman Ayarlar bölümünden silebilirsiniz. Bu koşulları ihlal eden hesapları askıya alabiliriz.',
      ] },
      { h: 'Değişiklikler ve uyuşmazlıklar', p: [
        'Koşulları güncelleyebiliriz. Önemli değişiklikler e-postayla veya uygulama içinde bildirilir. İsveç hukuku uygulanır. Tüketici olarak İsveç Tüketici Şikâyetleri Kurulu\'na (ARN) veya AB\'nin çevrimiçi uyuşmazlık çözüm platformuna başvurabilirsiniz.',
      ] },
    ],
  },
};

const es: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: 'Política de privacidad',
    lead: 'Aquí explicamos qué datos personales trata CVzume, por qué y qué derechos tienes según el Reglamento General de Protección de Datos (RGPD). La versión original es la sueca.',
    sections: [
      { h: 'Responsable del tratamiento', p: [`CVzume es responsable del tratamiento de tus datos. Puedes contactarnos en ${CONTACT}.`] },
      { h: 'Qué datos tratamos', p: [
        'Datos de la cuenta: nombre, correo electrónico y contraseña (la contraseña se guarda cifrada por nuestro proveedor de inicio de sesión).',
        'Perfil y CV: la información que tú introduces o subes, como experiencia laboral, formación, competencias, idiomas y foto de perfil.',
        'Solicitudes: ofertas de empleo que pegas o guardas, textos de CV y cartas generados, el estado de tus solicitudes y tus ofertas favoritas.',
        'Pago: si compras Pro, Stripe gestiona los datos de tu tarjeta. Nosotros solo conocemos tu correo electrónico, tu plan y si el pago se ha completado.',
        'Información técnica: estadísticas de visitas anónimas (Vercel Web Analytics, sin cookies) y registros del servidor necesarios para prestar el servicio de forma segura. Si aceptas las cookies de estadística, también usamos Google Analytics (ver Cookies).',
      ] },
      { h: 'Por qué tratamos los datos', p: [
        'Para prestar el servicio que has solicitado: crear y guardar CV, cartas y solicitudes (base jurídica: contrato).',
        'Para gestionar pagos y contabilidad (contrato y obligación legal).',
        'Para enviar los correos necesarios sobre tu cuenta y tu suscripción (contrato).',
        'Para evitar abusos, por ejemplo que la misma dirección de correo se registre una y otra vez para el uso gratuito. Por eso, cuando eliminas tu cuenta guardamos un hash unidireccional del correo, no la dirección en sí (interés legítimo).',
      ] },
      { h: 'Tratamiento con IA', p: [
        'Cuando analizas una oferta, la oferta y las partes relevantes de tu perfil se envían a un proveedor de IA que genera el texto. Usamos principalmente Groq y, como alternativa, Google (Gemini) y OpenRouter. Estos proveedores pueden tratar los datos fuera de la UE/EEE, por ejemplo en EE. UU. La transferencia se basa en las cláusulas contractuales tipo de la Comisión Europea o en el Marco de Privacidad de Datos UE-EE. UU.',
        'Evita introducir datos sensibles (por ejemplo, salud, religión o tu DNI/NIE) en tu perfil o en los campos de texto libre.',
        'La herramienta de prueba de la página principal funciona sin cuenta. El texto que escribes allí se envía al proveedor de IA, pero no lo guardamos. Para evitar abusos contamos el número de pruebas por dirección IP; solo guardamos un hash unidireccional de la IP, nunca la dirección en sí, y lo eliminamos en un máximo de dos días.',
      ] },
      { h: 'Dónde se guardan los datos', p: [
        'La base de datos, el inicio de sesión y los archivos se guardan en Supabase en la UE (Irlanda). El sitio web funciona en Vercel. Los correos se envían con Resend y los pagos los gestiona Stripe. Todos los proveedores son encargados del tratamiento con contratos que regulan cómo pueden usar los datos.',
      ] },
      { h: 'Cuánto tiempo guardamos los datos', p: [
        'Guardamos tus datos mientras tengas una cuenta. Puedes eliminar tu cuenta cuando quieras en Ajustes → Cuenta; se borrarán tu perfil, CV, solicitudes y favoritos. Los datos que la normativa contable sueca nos obliga a conservar (como recibos) los guarda Stripe durante siete años.',
      ] },
      { h: 'Tus derechos', p: [
        'Tienes derecho a solicitar el acceso, la rectificación, la supresión y la portabilidad de tus datos, así como a oponerte al tratamiento o pedir su limitación. Escríbenos a ' + CONTACT + '.',
        'Si crees que tratamos tus datos de forma incorrecta, puedes reclamar ante la Autoridad Sueca de Protección de la Privacidad (IMY, imy.se) o, si resides en España, ante la Agencia Española de Protección de Datos (aepd.es).',
      ] },
    ],
  },
  cookies: {
    title: 'Cookies',
    lead: 'CVzume no usa cookies publicitarias. Las cookies de estadística de Google Analytics solo se instalan si las aceptas. Esto es lo que se guarda en tu navegador.',
    sections: [
      { h: 'Cookies y almacenamiento necesarios', p: [
        'NEXT_LOCALE: recuerda el idioma que has elegido (1 año).',
        'cvz_country: el país desde el que nos visitas, según tu dirección IP (30 días). Se usa para mostrar el contenido y la fuente de empleo adecuados.',
        'Almacenamiento local (localStorage): mantiene tu sesión iniciada y guarda ajustes como el idioma y los borradores. Nunca sale de tu navegador y se borra al cerrar sesión.',
      ] },
      { h: 'Estadísticas de visitas', p: [
        'Usamos Vercel Web Analytics para obtener estadísticas anónimas de páginas vistas. No usa cookies ni identifica a visitantes individuales.',
        'Si aceptas en el aviso de cookies, también usamos Google Analytics para entender cómo se usa el sitio. Instala cookies (_ga, _ga_*, hasta 14 meses). No se guardan direcciones IP y las funciones publicitarias de Google (señales de Google y personalización de anuncios) están desactivadas. Google Ireland trata los datos por cuenta nuestra; puede haber transferencias a EE. UU. en el marco del EU-U.S. Data Privacy Framework.',
      ] },
      { h: 'Pago', p: [
        'Cuando pagas Pro, se te redirige a Stripe, que puede usar sus propias cookies para prevenir el fraude. Consulta la política de privacidad de Stripe para más información.',
      ] },
      { h: 'Consentimiento', p: [
        'Las cookies de estadística de Google Analytics solo se instalan después de que pulses «Aceptar» en el aviso de cookies. Si rechazas, Google Analytics no se carga. Puedes cambiar tu elección en cualquier momento con el enlace «Configuración de cookies» al final de la página. El resto del almacenamiento indicado arriba es necesario para que el servicio funcione y no requiere consentimiento.',
      ] },
    ],
  },
  terms: {
    title: 'Condiciones de uso',
    lead: 'Estas condiciones se aplican cuando usas CVzume. Al crear una cuenta las aceptas. La versión original es la sueca.',
    sections: [
      { h: 'El servicio', p: [
        'CVzume es una herramienta que te ayuda a crear CV y cartas de presentación y a preparar solicitudes de empleo con ayuda de la IA. No garantizamos que consigas un trabajo, y el servicio puede no estar disponible ocasionalmente por mantenimiento o fallos de nuestros proveedores.',
      ] },
      { h: 'Tu responsabilidad', p: [
        'Eres responsable de que la información de tu CV y tus solicitudes sea veraz. El texto generado por IA puede contener errores: revísalo y corrígelo siempre antes de enviarlo a un empleador.',
        'No puedes usar el servicio para crear contenido engañoso, ilegal u ofensivo, ni intentar eludir limitaciones como los límites de uso.',
        'Eres responsable de mantener tu contraseña en secreto.',
      ] },
      { h: 'Plan gratuito y Pro', p: [
        'La cuenta gratuita incluye un número limitado de generaciones con IA al mes. Pro ofrece uso ilimitado según los precios publicados en el sitio web.',
        'Pro se paga por adelantado, mensual o anualmente, a través de Stripe y se renueva automáticamente hasta que lo canceles. No hay permanencia. Lo cancelas tú mismo en Ajustes → Plan → Gestionar suscripción; Pro sigue activo hasta el final del periodo pagado. Los periodos pagados no se reembolsan con carácter retroactivo.',
        'Derecho de desistimiento: según la normativa sueca de contratos a distancia, dispones de 14 días de desistimiento desde la compra. Escribe a ' + CONTACT + ' si quieres desistir. Si ya has usado el servicio durante ese tiempo, podemos descontar una parte razonable del precio.',
        'Podemos cambiar los precios. Los cambios se aplican a partir del siguiente periodo de facturación y se comunican con antelación por correo electrónico.',
      ] },
      { h: 'Contenido', p: [
        'Eres propietario de lo que escribes y de los textos que se generan para ti. Nos concedes el derecho a guardar y tratar el contenido en la medida necesaria para prestar el servicio.',
      ] },
      { h: 'Limitación de responsabilidad', p: [
        'El servicio se presta tal cual. No somos responsables de daños indirectos ni de oportunidades de empleo perdidas. Nuestra responsabilidad total se limita al importe que nos hayas pagado en los últimos doce meses. Esto no limita tus derechos según la legislación imperativa de consumo.',
      ] },
      { h: 'Cerrar la cuenta', p: [
        'Puedes eliminar tu cuenta cuando quieras en Ajustes. Podemos suspender las cuentas que incumplan estas condiciones.',
      ] },
      { h: 'Cambios y disputas', p: [
        'Podemos actualizar estas condiciones. Los cambios importantes se comunican por correo electrónico o en la aplicación. Se aplica la legislación sueca. Como consumidor puedes acudir a la Junta Nacional Sueca de Reclamaciones de Consumo (ARN) o a la plataforma europea de resolución de litigios en línea.',
      ] },
    ],
  },
};

const de: Record<LegalSlug, LegalDoc> = {
  privacy: {
    title: 'Datenschutzerklärung',
    lead: 'Hier erklären wir, welche personenbezogenen Daten CVzume verarbeitet, warum, und welche Rechte Sie nach der Datenschutz-Grundverordnung (DSGVO) haben. Maßgeblich ist die schwedische Fassung.',
    sections: [
      { h: 'Verantwortlicher', p: [`Verantwortlich für die Verarbeitung Ihrer Daten ist CVzume. Sie erreichen uns unter ${CONTACT}.`] },
      { h: 'Welche Daten wir verarbeiten', p: [
        'Kontodaten: Name, E-Mail-Adresse und Passwort (das Passwort wird von unserem Anmeldedienst verschlüsselt gespeichert).',
        'Profil und Lebenslauf: die Angaben, die Sie selbst eingeben oder hochladen, etwa Berufserfahrung, Ausbildung, Kompetenzen, Sprachen und Profilfoto.',
        'Bewerbungen: Stellenanzeigen, die Sie einfügen oder speichern, erstellte Lebenslauftexte und Anschreiben, der Status Ihrer Bewerbungen und gespeicherte Favoriten.',
        'Zahlung: Wenn Sie Pro kaufen, verarbeitet Stripe Ihre Kartendaten. Wir erfahren nur Ihre E-Mail-Adresse, Ihren Tarif und ob die Zahlung erfolgreich war.',
        'Technische Daten: anonyme Besuchsstatistiken (Vercel Web Analytics, ohne Cookies) und Serverprotokolle, die für den sicheren Betrieb erforderlich sind. Wenn Sie Statistik-Cookies zustimmen, nutzen wir zusätzlich Google Analytics (siehe Cookies).',
      ] },
      { h: 'Warum wir die Daten verarbeiten', p: [
        'Um den von Ihnen gewünschten Dienst zu erbringen — Lebensläufe, Anschreiben und Bewerbungen erstellen und speichern (Rechtsgrundlage: Vertrag, Art. 6 Abs. 1 lit. b DSGVO).',
        'Um Zahlungen und Buchhaltung abzuwickeln (Vertrag und rechtliche Verpflichtung).',
        'Um notwendige E-Mails zu Ihrem Konto und Ihrem Abonnement zu senden (Vertrag).',
        'Um Missbrauch zu verhindern, zum Beispiel dass dieselbe E-Mail-Adresse immer wieder für die kostenlose Nutzung registriert wird. Wenn Sie Ihr Konto löschen, speichern wir daher einen Einweg-Hash der E-Mail-Adresse, nicht die Adresse selbst (berechtigtes Interesse, Art. 6 Abs. 1 lit. f DSGVO).',
      ] },
      { h: 'Verarbeitung durch KI', p: [
        'Wenn Sie eine Anzeige analysieren, werden die Anzeige und relevante Teile Ihres Profils an einen KI-Anbieter gesendet, der den Text erstellt. Wir nutzen vorrangig Groq und als Ausweichlösung Google (Gemini) und OpenRouter. Diese Anbieter können Daten außerhalb der EU/des EWR verarbeiten, etwa in den USA. Die Übermittlung stützt sich auf die Standardvertragsklauseln der EU-Kommission oder das EU-US Data Privacy Framework.',
        'Bitte geben Sie keine sensiblen Daten (zum Beispiel Gesundheit, Religion, Steuer-ID oder Sozialversicherungsnummer) in Ihr Profil oder in Freitextfelder ein.',
        'Das Testwerkzeug auf der Startseite funktioniert ohne Konto. Der dort eingegebene Text wird an den KI-Anbieter gesendet, aber nicht bei uns gespeichert. Um Missbrauch zu verhindern, zählen wir die Tests pro IP-Adresse; wir speichern nur einen Einweg-Hash der IP-Adresse, nie die Adresse selbst, und löschen ihn nach spätestens zwei Tagen.',
      ] },
      { h: 'Wo die Daten gespeichert werden', p: [
        'Datenbank, Anmeldung und Dateien liegen bei Supabase in der EU (Irland). Die Website läuft bei Vercel. E-Mails werden über Resend versendet, Zahlungen von Stripe abgewickelt. Alle Anbieter sind Auftragsverarbeiter mit Verträgen, die regeln, wie sie die Daten verwenden dürfen.',
      ] },
      { h: 'Wie lange wir die Daten speichern', p: [
        'Wir speichern Ihre Daten, solange Sie ein Konto haben. Sie können Ihr Konto jederzeit unter Einstellungen → Konto löschen; dabei werden Profil, Lebenslauf, Bewerbungen und Favoriten gelöscht. Daten, die wir nach schwedischem Buchführungsrecht aufbewahren müssen (etwa Belege), speichert Stripe sieben Jahre lang.',
      ] },
      { h: 'Ihre Rechte', p: [
        'Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Datenübertragbarkeit sowie das Recht, der Verarbeitung zu widersprechen oder ihre Einschränkung zu verlangen. Schreiben Sie uns an ' + CONTACT + '.',
        'Wenn Sie meinen, dass wir Ihre Daten unrechtmäßig verarbeiten, können Sie sich bei der schwedischen Datenschutzbehörde (IMY, imy.se) oder bei der Datenschutzaufsichtsbehörde Ihres Wohnsitzlandes beschweren.',
      ] },
    ],
  },
  cookies: {
    title: 'Cookies',
    lead: 'CVzume verwendet keine Werbe-Cookies. Statistik-Cookies von Google Analytics werden nur gesetzt, wenn Sie zustimmen. Das wird in Ihrem Browser gespeichert.',
    sections: [
      { h: 'Notwendige Cookies und Speicher', p: [
        'NEXT_LOCALE — merkt sich die von Ihnen gewählte Sprache (1 Jahr).',
        'cvz_country — das Land, aus dem Sie uns besuchen, anhand Ihrer IP-Adresse (30 Tage). Wird verwendet, um passende Inhalte und die passende Jobquelle anzuzeigen.',
        'Lokaler Speicher (localStorage) — hält Sie angemeldet und speichert Einstellungen wie Sprache und Entwürfe. Er verlässt nie Ihren Browser und wird beim Abmelden gelöscht.',
      ] },
      { h: 'Besuchsstatistik', p: [
        'Wir nutzen Vercel Web Analytics für anonyme Statistiken zu Seitenaufrufen. Es verwendet keine Cookies und identifiziert keine einzelnen Besucher.',
        'Wenn Sie im Cookie-Hinweis zustimmen, nutzen wir zusätzlich Google Analytics, um zu verstehen, wie die Seite genutzt wird. Dabei werden Cookies gesetzt (_ga, _ga_*, bis zu 14 Monate). IP-Adressen werden nicht gespeichert, und die Werbefunktionen von Google (Google-Signale und Anzeigenpersonalisierung) sind deaktiviert. Google Ireland verarbeitet die Daten in unserem Auftrag; eine Übermittlung in die USA kann im Rahmen des EU-U.S. Data Privacy Framework erfolgen.',
      ] },
      { h: 'Zahlung', p: [
        'Wenn Sie für Pro bezahlen, werden Sie zu Stripe weitergeleitet; Stripe kann eigene Cookies zur Betrugsprävention setzen. Näheres in der Datenschutzerklärung von Stripe.',
      ] },
      { h: 'Einwilligung', p: [
        'Statistik-Cookies von Google Analytics werden erst gesetzt, nachdem Sie im Cookie-Hinweis auf „Akzeptieren“ geklickt haben. Lehnen Sie ab, wird Google Analytics gar nicht geladen. Sie können Ihre Wahl jederzeit über den Link „Cookie-Einstellungen“ unten auf der Seite ändern. Der übrige oben beschriebene Speicher ist für den Betrieb notwendig und erfordert keine Einwilligung.',
      ] },
    ],
  },
  terms: {
    title: 'Nutzungsbedingungen',
    lead: 'Diese Bedingungen gelten für die Nutzung von CVzume. Mit der Erstellung eines Kontos stimmen Sie ihnen zu. Maßgeblich ist die schwedische Fassung.',
    sections: [
      { h: 'Der Dienst', p: [
        'CVzume ist ein Werkzeug, das Ihnen mit Hilfe von KI hilft, Lebensläufe und Anschreiben zu erstellen und Bewerbungen vorzubereiten. Wir garantieren nicht, dass Sie eine Stelle bekommen, und der Dienst kann wegen Wartung oder Störungen bei unseren Anbietern zeitweise nicht verfügbar sein.',
      ] },
      { h: 'Ihre Verantwortung', p: [
        'Sie sind dafür verantwortlich, dass die Angaben in Ihrem Lebenslauf und Ihren Bewerbungen wahr sind. KI-generierter Text kann Fehler enthalten — lesen und korrigieren Sie ihn immer, bevor Sie ihn an einen Arbeitgeber senden.',
        'Sie dürfen den Dienst nicht nutzen, um irreführende, rechtswidrige oder beleidigende Inhalte zu erstellen oder Beschränkungen wie Nutzungsgrenzen zu umgehen.',
        'Sie sind dafür verantwortlich, Ihr Passwort geheim zu halten.',
      ] },
      { h: 'Kostenlos und Pro', p: [
        'Das kostenlose Konto umfasst eine begrenzte Anzahl an KI-Generierungen pro Monat. Pro bietet unbegrenzte Nutzung gemäß den Preisangaben auf der Website.',
        'Pro wird monatlich oder jährlich im Voraus über Stripe bezahlt und verlängert sich automatisch, bis Sie kündigen. Es gibt keine Mindestlaufzeit. Sie kündigen selbst unter Einstellungen → Tarif → Abonnement verwalten; Pro bleibt dann bis zum Ende des bezahlten Zeitraums aktiv. Bezahlte Zeiträume werden nicht rückwirkend erstattet.',
        'Widerrufsrecht: Nach schwedischem Fernabsatzrecht haben Sie ab dem Kauf ein Widerrufsrecht von 14 Tagen. Schreiben Sie an ' + CONTACT + ', wenn Sie widerrufen möchten. Haben Sie den Dienst in diesem Zeitraum bereits genutzt, können wir einen angemessenen Teil des Preises abziehen.',
        'Wir können die Preise ändern. Änderungen gelten ab dem nächsten Abrechnungszeitraum und werden rechtzeitig per E-Mail angekündigt.',
      ] },
      { h: 'Inhalte', p: [
        'Was Sie schreiben und die für Sie erstellten Texte gehören Ihnen. Sie räumen uns das Recht ein, die Inhalte zu speichern und zu verarbeiten, soweit dies für die Erbringung des Dienstes erforderlich ist.',
      ] },
      { h: 'Haftungsbeschränkung', p: [
        'Der Dienst wird so bereitgestellt, wie er ist. Wir haften nicht für indirekte Schäden oder entgangene Stellenangebote. Unsere Gesamthaftung ist auf den Betrag begrenzt, den Sie uns in den letzten zwölf Monaten gezahlt haben. Ihre Rechte nach zwingendem Verbraucherrecht bleiben unberührt.',
      ] },
      { h: 'Konto schließen', p: [
        'Sie können Ihr Konto jederzeit unter Einstellungen löschen. Wir können Konten sperren, die gegen diese Bedingungen verstoßen.',
      ] },
      { h: 'Änderungen und Streitigkeiten', p: [
        'Wir können diese Bedingungen aktualisieren. Wesentliche Änderungen teilen wir per E-Mail oder in der App mit. Es gilt schwedisches Recht. Als Verbraucher können Sie sich an die schwedische Verbraucherbeschwerdestelle (ARN) oder an die Online-Streitbeilegungsplattform der EU wenden.',
      ] },
    ],
  },
};

const DOCS: Record<string, Record<LegalSlug, LegalDoc>> = { sv, en, tr, es, de };

export function getLegal(locale: string, slug: LegalSlug): LegalDoc {
  return (DOCS[locale] ?? en)[slug];
}

export const SLUGS: LegalSlug[] = ['privacy', 'cookies', 'terms'];
