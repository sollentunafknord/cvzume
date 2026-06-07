import { Cta, FaqSection, GuideJsonLd, GuideShell, H2, Quote, guideMetadata, type Faq } from '../_shared';

const SLUG = 'personligt-brev-exempel';
const DESCRIPTION =
  'Skriv ett personligt brev som sticker ut. Färdiga exempel, gratis mall och konkreta tips – plus hur du gör det automatiskt med AI på svenska.';

export const metadata = guideMetadata({
  slug: SLUG,
  title: 'Personligt brev – exempel, mall och tips (2026) | CVzume',
  description: DESCRIPTION,
  keywords:
    'personligt brev, personligt brev exempel, personligt brev mall, hur skriver man ett personligt brev, personligt brev nyanländ, jobbansökan svenska',
});

const FAQ: Faq[] = [
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

export default function Page() {
  return (
    <GuideShell
      title="Personligt brev: exempel, mall och tips för 2026"
      lead={
        <>
          Ett välskrivet <strong>personligt brev</strong> kan vara skillnaden mellan en intervju och
          ett automatiskt nej. I den här guiden får du ett konkret exempel, en gratis mall och de
          vanligaste misstagen att undvika – oavsett om du är erfaren eller söker ditt första jobb i
          Sverige.
        </>
      }
    >
      <GuideJsonLd
        slug={SLUG}
        headline="Personligt brev: exempel, mall och tips för 2026"
        description={DESCRIPTION}
        faq={FAQ}
      />

      <H2>Vad är ett personligt brev?</H2>
      <p>
        Det personliga brevet kompletterar ditt CV. Medan CV:t listar <em>vad</em> du har gjort,
        förklarar brevet <em>varför</em> just du passar för tjänsten – och visar att du har förstått
        vad arbetsgivaren söker.
      </p>

      <H2>Så är ett personligt brev uppbyggt</H2>
      <ol>
        <li>
          <strong>Rubrik och hälsning</strong> – tjänsten du söker och, om möjligt, namn på
          rekryteraren.
        </li>
        <li>
          <strong>Inledning</strong> – fånga intresset i första meningen. Varför söker du just den
          här tjänsten?
        </li>
        <li>
          <strong>Brödtext</strong> – koppla din erfarenhet till kraven i annonsen. Ge konkreta
          exempel.
        </li>
        <li>
          <strong>Avslutning</strong> – en tydlig uppmaning: du ser fram emot att berätta mer på en
          intervju.
        </li>
      </ol>

      <H2>Exempel på personligt brev</H2>
      <Quote>
        <p>Hej,</p>
        <p>
          Jag söker tjänsten som lagermedarbetare hos er som ni annonserat på Platsbanken. Med två
          års erfarenhet av lagerarbete och truckkort A+B är jag van vid ett högt tempo och att ta
          ansvar för att leveranserna stämmer.
        </p>
        <p>
          På mitt nuvarande jobb minskade vi plockfelen med 20 % genom rutiner som jag var med och
          tog fram. Jag trivs i team, lär mig snabbt och ställer gärna upp när det behövs.
        </p>
        <p>Jag ser fram emot att få berätta mer om vad jag kan bidra med på en intervju.</p>
        <p>
          Med vänliga hälsningar,
          <br />
          Förnamn Efternamn
        </p>
      </Quote>

      <H2>Vanliga misstag att undvika</H2>
      <ul>
        <li>
          <strong>Generiskt brev</strong> som skickas till alla annonser – rekryterare märker det
          direkt.
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

      <H2>Är du ny i Sverige?</H2>
      <p>
        Att skriva på korrekt svenska och följa svenska normer är ofta det svåraste. Fokusera på
        konkreta resultat, undvik att översätta rakt av från ditt modersmål, och låt någon
        korrekturläsa – eller använd ett verktyg som skriver brevet på svenska åt dig.
      </p>

      <Cta heading="Skriv ditt personliga brev automatiskt">
        Med <strong>CVzume</strong> klistrar du in jobbannonsen och får ett personligt brev på
        korrekt svenska, anpassat efter just den tjänsten – på under en minut. Gratis att börja.
      </Cta>

      <FaqSection items={FAQ} />
    </GuideShell>
  );
}
