import { Cta, FaqSection, GuideJsonLd, GuideShell, H2, RelatedGuides, guideMetadata, type Faq } from '../_shared';

const SLUG = 'cv-for-nyanlanda';
const DESCRIPTION =
  'Så skriver du ett svenskt CV som nyanländ: format, vad du ska ta med, språknivåer och referenser. Plus hur du gör det på korrekt svenska med AI – gratis att börja.';

export const metadata = guideMetadata({
  slug: SLUG,
  title: 'CV för dig som är ny i Sverige: guide och exempel | CVzume',
  description: DESCRIPTION,
  keywords:
    'cv för nyanlända, cv ny i sverige, svenskt cv, cv på svenska, jobb i sverige cv, personligt brev nyanländ',
});

const FAQ: Faq[] = [
  {
    q: 'Måste mitt CV vara på svenska?',
    a: 'För de flesta jobb i Sverige – ja. Vissa internationella företag accepterar engelska, men ett CV på korrekt svenska visar att du är seriös och anpassar dig till arbetsmarknaden.',
  },
  {
    q: 'Hur anger jag mina språkkunskaper?',
    a: 'Ange varje språk med nivå, t.ex. modersmål, flytande, goda kunskaper eller grundläggande. Du kan även använda CEFR-skalan (A1–C2).',
  },
  {
    q: 'Ska jag ta med utbildning från mitt hemland?',
    a: 'Ja. Ange examen, lärosäte och år. Om utbildningen är bedömd av UHR (Universitets- och högskolerådet) kan du nämna det – det ger trygghet åt arbetsgivaren.',
  },
  {
    q: 'Behöver jag personnummer på mitt CV?',
    a: 'Nej, personnummer behövs inte på ett svenskt CV. Det räcker med namn, telefon, e-post och ort.',
  },
];

export default function Page() {
  return (
    <GuideShell
      title="CV för dig som är ny i Sverige"
      lead={
        <>
          Att söka jobb i ett nytt land är svårt nog – ovanpå det ska CV:t följa svenska normer och
          vara på korrekt svenska. Den här guiden visar exakt hur ett svenskt CV ser ut och vad du
          ska tänka på som nyanländ.
        </>
      }
    >
      <GuideJsonLd
        slug={SLUG}
        headline="CV för dig som är ny i Sverige"
        description={DESCRIPTION}
        faq={FAQ}
      />

      <H2>Så skiljer sig ett svenskt CV</H2>
      <ul>
        <li>
          <strong>Inget personnummer</strong> och oftast <strong>inget foto</strong> – fokus ligger
          på din kompetens.
        </li>
        <li>
          <strong>Kort och konkret</strong> – en till två sidor, omvänd kronologisk ordning (senaste
          först).
        </li>
        <li>
          <strong>Resultat framför titlar</strong> – beskriv vad du åstadkom, gärna med siffror.
        </li>
        <li>
          <strong>Korrekt svenska</strong> – undvik att översätta rakt av från ditt modersmål.
        </li>
      </ul>

      <H2>Vad du ska ta med</H2>
      <ul>
        <li>Kontaktuppgifter: namn, telefon, e-post, ort</li>
        <li>Kort profiltext om vem du är och vad du söker</li>
        <li>Arbetslivserfarenhet – även från ditt hemland</li>
        <li>Utbildning – examen, lärosäte, år</li>
        <li>Språk med nivå</li>
        <li>Färdigheter och eventuella körkort/certifikat</li>
      </ul>

      <H2>Språknivåer – så anger du dem</H2>
      <p>
        Var ärlig och tydlig. Exempel: <em>Arabiska – modersmål, Svenska – goda kunskaper (SFI
        klar), Engelska – flytande</em>. Att överdriva din svenska kan ge problem i intervjun, så
        håll dig till sanningen.
      </p>

      <H2>Utbildning från utlandet</H2>
      <p>
        Ta med din utländska utbildning precis som den är. Om du har fått den bedömd av{' '}
        <strong>UHR</strong> kan du skriva det – det hjälper arbetsgivaren att förstå din nivå i ett
        svenskt sammanhang.
      </p>

      <H2>Vanliga misstag</H2>
      <ul>
        <li>Att lämna luckor i CV:t oförklarade (t.ex. tiden efter ankomst till Sverige).</li>
        <li>Direkt översättning som låter onaturlig på svenska.</li>
        <li>Att inte anpassa CV:t efter den svenska annonsen.</li>
      </ul>

      <Cta heading="Få ett svenskt CV på korrekt svenska">
        <strong>CVzume</strong> skapar ditt CV och personliga brev på flytande svenska, anpassat
        efter jobbannonsen – även om svenska inte är ditt modersmål. Gratis att börja.
      </Cta>

      <FaqSection items={FAQ} />
      <RelatedGuides current={SLUG} />
    </GuideShell>
  );
}
