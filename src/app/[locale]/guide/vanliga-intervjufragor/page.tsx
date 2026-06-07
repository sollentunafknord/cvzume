import { Cta, FaqSection, GuideJsonLd, GuideShell, H2, Quote, guideMetadata, type Faq } from '../_shared';

const SLUG = 'vanliga-intervjufragor';
const DESCRIPTION =
  'De vanligaste intervjufrågorna på svenska anställningsintervjuer – med konkreta tips på hur du svarar. Förbered dig och gå in i intervjun med självförtroende.';

export const metadata = guideMetadata({
  slug: SLUG,
  title: 'Vanliga intervjufrågor och svar (2026) | CVzume',
  description: DESCRIPTION,
  keywords:
    'intervjufrågor, vanliga intervjufrågor, anställningsintervju frågor, jobbintervju frågor och svar, intervju tips, intervjuförberedelse',
});

const FAQ: Faq[] = [
  {
    q: 'Hur förbereder jag mig bäst inför en intervju?',
    a: 'Läs på om företaget, gå igenom annonsen och förbered konkreta exempel på vad du åstadkommit. Öva på att svara högt på de vanligaste frågorna.',
  },
  {
    q: 'Vad är STAR-metoden?',
    a: 'STAR står för Situation, Task (uppgift), Action (handling) och Result (resultat). Den hjälper dig att svara strukturerat på frågor om hur du agerat i olika situationer.',
  },
  {
    q: 'Vilka frågor kan jag själv ställa till arbetsgivaren?',
    a: 'Fråga om teamet, förväntningar på de första månaderna och hur framgång mäts i rollen. Det visar genuint intresse och att du tänker framåt.',
  },
  {
    q: 'Hur svarar jag på frågan om mina svagheter?',
    a: 'Var ärlig, välj en verklig svaghet och visa hur du arbetar med att förbättra den. Undvik klyschor som ”jag är för perfektionistisk”.',
  },
];

export default function Page() {
  return (
    <GuideShell
      title="Vanliga intervjufrågor – och hur du svarar"
      lead={
        <>
          Du har fått intervjun – grattis! Nu gäller det att förbereda sig. Här är de vanligaste
          frågorna på svenska anställningsintervjuer och konkreta tips på hur du svarar så att du
          sticker ut.
        </>
      }
    >
      <GuideJsonLd
        slug={SLUG}
        headline="Vanliga intervjufrågor – och hur du svarar"
        description={DESCRIPTION}
        faq={FAQ}
      />

      <H2>”Berätta lite om dig själv”</H2>
      <p>
        Den vanligaste öppningsfrågan. Håll det kort (en–två minuter) och yrkesinriktat: vem du är
        professionellt, din relevanta erfarenhet och varför du söker just den här rollen. Spara
        privatlivet.
      </p>

      <H2>”Varför söker du den här tjänsten?”</H2>
      <p>
        Koppla ihop dina mål med företaget. Visa att du läst på – nämn något konkret om bolaget eller
        rollen som lockar dig.
      </p>

      <H2>”Vilka är dina styrkor och svagheter?”</H2>
      <p>
        Välj styrkor som är relevanta för jobbet och backa upp dem med exempel. För svagheter: var
        ärlig och visa hur du arbetar med att bli bättre.
      </p>

      <H2>Svara strukturerat med STAR-metoden</H2>
      <p>
        På frågor som ”berätta om en gång då du löste ett problem” – använd STAR:
      </p>
      <Quote>
        <p>
          <strong>S</strong>ituation – sätt scenen kort.
          <br />
          <strong>T</strong>ask – vad var din uppgift?
          <br />
          <strong>A</strong>ction – vad gjorde <em>du</em> konkret?
          <br />
          <strong>R</strong>esult – vad blev resultatet, gärna med siffror?
        </p>
      </Quote>

      <H2>Frågor du själv kan ställa</H2>
      <ul>
        <li>Hur ser ett typiskt arbetsår ut i den här rollen?</li>
        <li>Vad förväntas jag ha åstadkommit efter de första tre månaderna?</li>
        <li>Hur ser teamet ut som jag skulle jobba med?</li>
        <li>Hur mäter ni framgång i rollen?</li>
      </ul>

      <H2>Sista tipsen</H2>
      <ul>
        <li>Öva högt – gärna med någon annan eller framför spegeln.</li>
        <li>Kom i tid och ha annonsen färsk i minnet.</li>
        <li>Avsluta med att tacka och visa att du är intresserad.</li>
      </ul>

      <Cta heading="Öva på intervjun innan du går in">
        Med <strong>CVzume</strong> kan du förbereda dig med intervjufrågor anpassade efter just den
        tjänst du söker – och få ditt CV och personliga brev klart på köpet. Gratis att börja.
      </Cta>

      <FaqSection items={FAQ} />
    </GuideShell>
  );
}
