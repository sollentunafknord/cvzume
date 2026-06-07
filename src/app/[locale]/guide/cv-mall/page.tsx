import { Cta, FaqSection, GuideJsonLd, GuideShell, H2, Quote, RelatedGuides, guideMetadata, type Faq } from '../_shared';

const SLUG = 'cv-mall';
const DESCRIPTION =
  'Gratis CV-mall och exempel. Lär dig vad ett CV ska innehålla, hur du strukturerar det och vilka misstag du ska undvika – plus hur du skapar ditt CV automatiskt med AI.';

export const metadata = guideMetadata({
  slug: SLUG,
  title: 'CV-mall och exempel: så skriver du ett CV (2026) | CVzume',
  description: DESCRIPTION,
  keywords:
    'cv mall, skapa cv, cv exempel, cv mall gratis, hur skriver man ett cv, cv struktur, cv på svenska',
});

const FAQ: Faq[] = [
  {
    q: 'Hur långt ska ett CV vara?',
    a: 'En till två A4-sidor. Har du lång erfarenhet räcker oftast två sidor – ta med det mest relevanta för tjänsten, inte allt du gjort.',
  },
  {
    q: 'Ska jag ha med ett foto på mitt CV?',
    a: 'I Sverige är foto frivilligt och inte längre standard. Många väljer att hoppa över det för att undvika omedveten diskriminering. Innehållet är viktigast.',
  },
  {
    q: 'I vilken ordning ska jag lista mina erfarenheter?',
    a: 'Omvänd kronologisk ordning – det senaste först. Det gör det enkelt för rekryteraren att se var du är i din karriär just nu.',
  },
  {
    q: 'Behöver jag anpassa mitt CV för varje jobb?',
    a: 'Ja. Lyft fram de erfarenheter och nyckelord som matchar annonsen. Ett anpassat CV ökar tydligt dina chanser att gå vidare.',
  },
];

export default function Page() {
  return (
    <GuideShell
      title="CV-mall och exempel: så skriver du ett CV som ger intervju"
      lead={
        <>
          Ditt <strong>CV</strong> är din viktigaste säljtext. I den här guiden går vi igenom vad ett
          CV ska innehålla, i vilken ordning – och en gratis mall du kan utgå från. Allt anpassat
          efter hur rekryterare i Sverige faktiskt läser.
        </>
      }
    >
      <GuideJsonLd
        slug={SLUG}
        headline="CV-mall och exempel: så skriver du ett CV som ger intervju"
        description={DESCRIPTION}
        faq={FAQ}
      />

      <H2>Vad ska ett CV innehålla?</H2>
      <ul>
        <li>
          <strong>Kontaktuppgifter</strong> – namn, telefon, e-post och ort. Personnummer behövs
          inte.
        </li>
        <li>
          <strong>Profil/sammanfattning</strong> – 2–3 meningar om vem du är och vad du söker.
        </li>
        <li>
          <strong>Arbetslivserfarenhet</strong> – titel, arbetsgivare, period och vad du åstadkom.
        </li>
        <li>
          <strong>Utbildning</strong> – examen, skola och år.
        </li>
        <li>
          <strong>Färdigheter</strong> – tekniska kunskaper, system och språk.
        </li>
        <li>
          <strong>Språk</strong> – ange nivå (t.ex. svenska – flytande, engelska – goda kunskaper).
        </li>
      </ul>

      <H2>Struktur – i rätt ordning</H2>
      <ol>
        <li>Namn och kontaktuppgifter högst upp</li>
        <li>Kort profiltext</li>
        <li>Arbetslivserfarenhet (senaste först)</li>
        <li>Utbildning</li>
        <li>Färdigheter och språk</li>
        <li>Eventuellt: referenser ”lämnas på begäran”</li>
      </ol>

      <H2>Exempel: en stark erfarenhetspunkt</H2>
      <Quote>
        <p>
          <strong>Butikssäljare</strong> – ICA Maxi, Stockholm (2022–2024)
        </p>
        <p>
          Ansvarade för kassa, varuplock och kundservice. Ökade merförsäljningen i min avdelning med
          15 % genom att lägga om exponeringen av kampanjvaror.
        </p>
      </Quote>
      <p>
        Notera formeln: <em>vad du gjorde + ett konkret resultat med siffror</em>. Det är det som
        får ett CV att sticka ut.
      </p>

      <H2>Nyckelord och ATS</H2>
      <p>
        Många företag använder system (ATS) som söker efter nyckelord från annonsen. Använd samma
        ord som arbetsgivaren – står det ”projektledning” i annonsen, skriv ”projektledning”, inte
        ett synonym.
      </p>

      <H2>Vanliga misstag att undvika</H2>
      <ul>
        <li>Samma CV till alla jobb istället för att anpassa.</li>
        <li>Långa ansvarsbeskrivningar utan resultat.</li>
        <li>Stavfel och inkonsekvent formatering.</li>
        <li>Att ta med allt – ta bara med det relevanta.</li>
      </ul>

      <Cta heading="Skapa ditt CV på minuter">
        Med <strong>CVzume</strong> klistrar du in jobbannonsen och får ett färdigt, anpassat CV med
        rätt nyckelord – plus ett personligt brev på svenska. Gratis att börja.
      </Cta>

      <FaqSection items={FAQ} />
      <RelatedGuides current={SLUG} />
    </GuideShell>
  );
}
