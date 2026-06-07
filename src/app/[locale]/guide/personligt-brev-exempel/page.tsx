import type { Metadata } from 'next';

const BASE_URL = 'https://www.cvzume.com';
const CANONICAL = `${BASE_URL}/sv/guide/personligt-brev-exempel`;
const REGISTER_URL = `${BASE_URL}/sv/auth#register`;

const TITLE = 'Personligt brev – exempel, mall och tips (2026) | CVzume';
const DESCRIPTION =
  'Skriv ett personligt brev som sticker ut. Färdiga exempel, gratis mall och konkreta tips – plus hur du gör det automatiskt med AI på svenska.';

export function generateMetadata(): Metadata {
  return {
    title: TITLE,
    description: DESCRIPTION,
    keywords:
      'personligt brev, personligt brev exempel, personligt brev mall, hur skriver man ett personligt brev, personligt brev nyanländ, jobbansökan svenska',
    robots: 'index, follow',
    alternates: { canonical: CANONICAL },
    openGraph: {
      title: TITLE,
      description: DESCRIPTION,
      url: CANONICAL,
      type: 'article',
      locale: 'sv_SE',
      siteName: 'CVzume',
    },
  };
}

const FAQ = [
  {
    q: 'Hur långt ska ett personligt brev vara?',
    a: 'En halv till en A4-sida räcker. Rekryterare lägger ofta bara några sekunder på första intrycket, så håll dig kort och konkret.',
  },
  {
    q: 'Ska jag skriva ett nytt brev för varje jobb?',
    a: 'Ja. Anpassa alltid brevet efter annonsen och koppla din erfarenhet till de specifika kraven. Generiska brev märks direkt.',
  },
  {
    q: 'Behöver jag ett personligt brev om annonsen inte kräver det?',
    a: 'Oftast ja. Ett personligt brev stärker din ansökan och ger dig chansen att förklara varför just du passar för tjänsten.',
  },
  {
    q: 'Hur skriver jag ett personligt brev om svenska inte är mitt modersmål?',
    a: 'Fokusera på konkreta resultat, undvik direkta översättningar från ditt modersmål och låt någon korrekturläsa. Du kan också använda ett verktyg som CVzume som skriver brevet på korrekt svenska åt dig.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Personligt brev: exempel, mall och tips för 2026',
      description: DESCRIPTION,
      inLanguage: 'sv-SE',
      mainEntityOfPage: CANONICAL,
      author: { '@type': 'Organization', name: 'CVzume', url: BASE_URL },
      publisher: { '@type': 'Organization', name: 'CVzume', url: BASE_URL },
    },
    {
      '@type': 'FAQPage',
      mainEntity: FAQ.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ],
};

export default function PersonligtBrevGuide() {
  return (
    <main
      style={{
        maxWidth: 760,
        margin: '0 auto',
        padding: '48px 20px 80px',
        fontFamily: "'Segoe UI', system-ui, Arial, sans-serif",
        color: '#1E293B',
        lineHeight: 1.7,
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <a href="/sv" style={{ color: '#2563EB', textDecoration: 'none', fontSize: 14 }}>
        ← Till startsidan
      </a>

      <h1 style={{ fontSize: 34, lineHeight: 1.2, color: '#0D1B2A', margin: '20px 0 16px' }}>
        Personligt brev: exempel, mall och tips för 2026
      </h1>

      <p style={{ fontSize: 18, color: '#334155' }}>
        Ett välskrivet <strong>personligt brev</strong> kan vara skillnaden mellan en intervju och ett
        automatiskt nej. I den här guiden får du ett konkret exempel, en gratis mall och de vanligaste
        misstagen att undvika – oavsett om du är erfaren eller söker ditt första jobb i Sverige.
      </p>

      <h2 style={h2}>Vad är ett personligt brev?</h2>
      <p>
        Det personliga brevet kompletterar ditt CV. Medan CV:t listar <em>vad</em> du har gjort, förklarar
        brevet <em>varför</em> just du passar för tjänsten – och visar att du har förstått vad arbetsgivaren
        söker.
      </p>

      <h2 style={h2}>Så är ett personligt brev uppbyggt</h2>
      <ol>
        <li>
          <strong>Rubrik och hälsning</strong> – tjänsten du söker och, om möjligt, namn på rekryteraren.
        </li>
        <li>
          <strong>Inledning</strong> – fånga intresset i första meningen. Varför söker du just den här
          tjänsten?
        </li>
        <li>
          <strong>Brödtext</strong> – koppla din erfarenhet till kraven i annonsen. Ge konkreta exempel.
        </li>
        <li>
          <strong>Avslutning</strong> – en tydlig uppmaning: du ser fram emot att berätta mer på en intervju.
        </li>
      </ol>

      <h2 style={h2}>Exempel på personligt brev</h2>
      <blockquote style={quote}>
        <p>Hej,</p>
        <p>
          Jag söker tjänsten som lagermedarbetare hos er som ni annonserat på Platsbanken. Med två års
          erfarenhet av lagerarbete och truckkort A+B är jag van vid ett högt tempo och att ta ansvar för att
          leveranserna stämmer.
        </p>
        <p>
          På mitt nuvarande jobb minskade vi plockfelen med 20 % genom rutiner som jag var med och tog fram.
          Jag trivs i team, lär mig snabbt och ställer gärna upp när det behövs.
        </p>
        <p>Jag ser fram emot att få berätta mer om vad jag kan bidra med på en intervju.</p>
        <p>
          Med vänliga hälsningar,
          <br />
          Förnamn Efternamn
        </p>
      </blockquote>

      <h2 style={h2}>Vanliga misstag att undvika</h2>
      <ul>
        <li>
          <strong>Generiskt brev</strong> som skickas till alla annonser – rekryterare märker det direkt.
        </li>
        <li>
          <strong>Att upprepa CV:t</strong> istället för att förklara <em>varför</em> du passar.
        </li>
        <li>
          <strong>För långt</strong> – håll dig till en halv till en A4-sida.
        </li>
        <li>
          <strong>Stavfel</strong> – särskilt viktigt om svenska inte är ditt modersmål.
        </li>
      </ul>

      <h2 style={h2}>Är du ny i Sverige?</h2>
      <p>
        Att skriva på korrekt svenska och följa svenska normer är ofta det svåraste. Fokusera på konkreta
        resultat, undvik att översätta rakt av från ditt modersmål, och låt någon korrekturläsa – eller använd
        ett verktyg som skriver brevet på svenska åt dig.
      </p>

      <div style={ctaBox}>
        <h2 style={{ ...h2, marginTop: 0 }}>Skriv ditt personliga brev automatiskt</h2>
        <p style={{ margin: '0 0 20px' }}>
          Med <strong>CVzume</strong> klistrar du in jobbannonsen och får ett personligt brev på korrekt
          svenska, anpassat efter just den tjänsten – på under en minut. Gratis att börja.
        </p>
        <a href={REGISTER_URL} style={ctaBtn}>
          Skapa ditt personliga brev gratis →
        </a>
      </div>

      <h2 style={h2}>Vanliga frågor</h2>
      {FAQ.map((f) => (
        <div key={f.q} style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, color: '#0D1B2A', margin: '0 0 6px' }}>{f.q}</h3>
          <p style={{ margin: 0 }}>{f.a}</p>
        </div>
      ))}
    </main>
  );
}

const h2: React.CSSProperties = { fontSize: 24, color: '#0D1B2A', margin: '36px 0 12px' };
const quote: React.CSSProperties = {
  borderLeft: '4px solid #2563EB',
  background: '#F8FAFC',
  margin: '16px 0',
  padding: '8px 20px',
  borderRadius: 8,
  color: '#334155',
};
const ctaBox: React.CSSProperties = {
  background: '#0D1B2A',
  color: '#E2E8F0',
  borderRadius: 16,
  padding: '28px 28px 32px',
  margin: '40px 0',
};
const ctaBtn: React.CSSProperties = {
  display: 'inline-block',
  background: '#2563EB',
  color: 'white',
  textDecoration: 'none',
  fontWeight: 600,
  padding: '14px 24px',
  borderRadius: 10,
};
