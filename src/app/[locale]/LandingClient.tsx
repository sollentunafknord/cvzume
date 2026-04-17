'use client';

import { useEffect } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './landing.module.css';

export default function LandingClient() {
  const locale = useLocale();
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('cvita_token');
    const user = localStorage.getItem('cvita_user');
    if (token && user) {
      router.replace(`/${locale}/dashboard`);
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add(styles.revealVisible);
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [locale, router]);

  const authUrl = `/${locale}/auth`;
  const registerUrl = `/${locale}/auth#register`;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: 'var(--navy)', background: 'white', overflowX: 'hidden' }}>

      {/* NAV */}
      <nav className={styles.nav}>
        <a href={`/${locale}`} className={styles.navLogo}>CV<span>zume</span></a>
        <ul className={styles.navLinks}>
          <li><a href="#hur">Hur det fungerar</a></li>
          <li><a href="#funktioner">Funktioner</a></li>
          <li><a href="#priser">Priser</a></li>
        </ul>
        <div className={styles.navCta}>
          <a href={authUrl} className={styles.btnGhost}>Logga in</a>
          <a href={registerUrl} className={styles.btnNavPrimary}>Kom igång gratis</a>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBg} />
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <span className={styles.heroBadgeDot} />
            AI-drivet för svenska jobbsökare
          </div>
          <h1 className={styles.heroH1}>Ditt nästa jobb börjar med rätt <em>CV</em></h1>
          <p className={styles.heroSub}>
            Analysera platsannonser, skapa anpassade CV:n och personliga brev på sekunder —
            med AI som förstår den svenska arbetsmarknaden.
          </p>
          <div className={styles.heroActions}>
            <a href={registerUrl} className={styles.btnHero}>Skapa ditt CV gratis →</a>
            <a href="#hur" className={styles.btnHeroGhost}>Se hur det fungerar</a>
          </div>
          <div className={styles.heroTrust}>
            <div className={styles.heroTrustAvatars}>
              <div className={`${styles.avatar} ${styles.av1}`}>AL</div>
              <div className={`${styles.avatar} ${styles.av2}`}>MK</div>
              <div className={`${styles.avatar} ${styles.av3}`}>JS</div>
              <div className={`${styles.avatar} ${styles.av4}`}>EB</div>
            </div>
            &nbsp;Redan använt av hundratals jobbsökare i Sverige
          </div>
        </div>

        {/* Mock product UI */}
        <div className={styles.heroVisual}>
          <div className={styles.browserFrame}>
            <div className={styles.browserBar}>
              <div className={styles.browserDots}>
                <div className={`${styles.browserDot} ${styles.bdRed}`} />
                <div className={`${styles.browserDot} ${styles.bdYellow}`} />
                <div className={`${styles.browserDot} ${styles.bdGreen}`} />
              </div>
              <div className={styles.browserUrl}>app.cvzume.com/dashboard</div>
            </div>
            <div className={styles.browserContent}>
              <div className={styles.mockSidebar}>
                <div className={styles.mockSidebarTitle}>Mina ansökningar</div>
                <div className={`${styles.mockJob} ${styles.mockJobActive}`}>
                  <div className={styles.mockJobTitle}>Frontend-utvecklare</div>
                  <div className={styles.mockJobCo}>Spotify · Stockholm</div>
                  <div className={styles.mockJobScore}>✓ 94% matchning</div>
                </div>
                <div className={`${styles.mockJob} ${styles.mockJob2}`}>
                  <div className={styles.mockJobTitle}>UX Designer</div>
                  <div className={styles.mockJobCo}>IKEA · Malmö</div>
                  <div className={styles.mockJobScore} style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>87% matchning</div>
                </div>
                <div className={`${styles.mockJob} ${styles.mockJob2}`}>
                  <div className={styles.mockJobTitle}>Product Manager</div>
                  <div className={styles.mockJobCo}>Klarna · Stockholm</div>
                  <div className={styles.mockJobScore} style={{ background: 'var(--blue-light)', color: 'var(--blue)' }}>81% matchning</div>
                </div>
              </div>
              <div className={styles.mockMain}>
                <div className={styles.mockCard}>
                  <div className={styles.mockCardHeader}>
                    <div className={styles.mockCardTitle}>Anpassat CV — Spotify Frontend</div>
                    <span className={`${styles.mockTag} ${styles.tagGreen}`}>Klart</span>
                  </div>
                  <div className={styles.mockLines}>
                    <div className={`${styles.mockLine} ${styles.wFull} ${styles.accent}`} />
                    <div className={`${styles.mockLine} ${styles.w3q}`} />
                    <div className={`${styles.mockLine} ${styles.wFull}`} />
                    <div className={`${styles.mockLine} ${styles.wHalf}`} />
                    <div className={`${styles.mockLine} ${styles.wFull} ${styles.accent}`} />
                    <div className={`${styles.mockLine} ${styles.w2q}`} />
                  </div>
                </div>
                <div className={styles.mockCard}>
                  <div className={styles.mockCardHeader}>
                    <div className={styles.mockCardTitle}>Nyckelord matchade</div>
                    <span className={`${styles.mockTag} ${styles.tagBlue}`}>Analys</span>
                  </div>
                  <div className={styles.mockProgressWrap}>
                    {[['React / Next.js', 95], ['TypeScript', 88], ['Agile/Scrum', 72]].map(([label, pct]) => (
                      <div key={label} className={styles.mockProgressRow}>
                        <div className={styles.mockProgressLabel}>{label}</div>
                        <div className={styles.mockProgressBar}><div className={styles.mockProgressFill} style={{ width: `${pct}%` }} /></div>
                        <div className={styles.mockProgressPct}>{pct}%</div>
                      </div>
                    ))}
                  </div>
                  <div className={styles.mockActions}>
                    <button className={`${styles.mockBtn} ${styles.mockBtnPrimary}`}>Ladda ner PDF</button>
                    <button className={`${styles.mockBtn} ${styles.mockBtnGhost}`}>Redigera</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="hur" className={styles.howSection}>
        <div className={styles.sectionWrap}>
          <div className={`${styles.sectionLabel} ${styles.reveal}`} data-reveal="">Hur det fungerar</div>
          <h2 className={`${styles.sectionTitle} ${styles.reveal} ${styles.revealDelay1}`} data-reveal="">Fyra steg till din<br />perfekta ansökan</h2>
          <p className={`${styles.sectionSub} ${styles.reveal} ${styles.revealDelay2}`} data-reveal="">Från platsannons till färdigt ansökningspaket — allt på några minuter.</p>
          <div className={styles.steps}>
            {[
              { icon: '📄', title: 'Ladda upp eller skapa ditt CV', desc: 'Importera ditt befintliga CV (PDF eller DOCX) eller bygg ett från grunden med vår guide.', delay: '' },
              { icon: '🔍', title: 'Klistra in platsannonsen', desc: 'Kopiera texten från valfri jobbannons. AI:n analyserar krav, nyckelord och ansvarsområden automatiskt.', delay: styles.revealDelay1 },
              { icon: '✨', title: 'Få ett anpassat CV', desc: 'AI:n skapar ett CV som lyfter fram rätt erfarenheter och kompetenser för just det jobbet.', delay: styles.revealDelay2 },
              { icon: '📬', title: 'Ladda ner & ansök', desc: 'Exportera CV och personligt brev som PDF. Allt sparas i din arkiv för framtida bruk.', delay: styles.revealDelay3 },
            ].map(s => (
              <div key={s.title} className={`${styles.step} ${styles.reveal} ${s.delay}`} data-reveal="">
                <div className={styles.stepIcon}>{s.icon}</div>
                <div className={styles.stepTitle}>{s.title}</div>
                <div className={styles.stepDesc}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="funktioner" className={styles.featuresSection}>
        <div className={styles.featuresInner}>
          <div className={`${styles.sectionLabel} ${styles.reveal}`} data-reveal="">Funktioner</div>
          <h2 className={`${styles.sectionTitle} ${styles.reveal} ${styles.revealDelay1}`} data-reveal="">Allt du behöver för<br />en lyckad jobbsökning</h2>
          <div className={styles.featuresGrid}>
            {[
              { icon: '🎯', title: 'Matchningsanalys', desc: 'Se exakt hur väl ditt CV matchar platsannonsen med en tydlig poäng och konkreta förbättringsförslag.', delay: '' },
              { icon: '📝', title: 'Personligt brev', desc: 'AI genererar ett engagerande personligt brev anpassat till företaget och rollen — på svenska.', delay: styles.revealDelay1 },
              { icon: '📁', title: 'Ansökningsarkiv', desc: 'Håll koll på alla ansökningar samlade. CV-version, personligt brev och datum — alltid tillgängligt.', delay: styles.revealDelay2 },
              { icon: '📤', title: 'PDF-export', desc: 'Ladda ner professionellt formaterade PDF-dokument redo att skickas direkt till arbetsgivaren.', delay: '' },
              { icon: '🔒', title: 'Dataskydd & GDPR', desc: 'Din data lagras säkert inom EU. Du äger alltid ditt innehåll och kan radera allt med ett klick.', delay: styles.revealDelay1 },
              { icon: '🌐', title: 'Fler språk snart', desc: 'Stöd för engelska och fler språk är under utveckling. Plattformen är byggt för att växa.', delay: styles.revealDelay2 },
            ].map(f => (
              <div key={f.title} className={`${styles.featureCard} ${styles.reveal} ${f.delay}`} data-reveal="">
                <div className={styles.featureIcon}>{f.icon}</div>
                <div className={styles.featureTitle}>{f.title}</div>
                <div className={styles.featureDesc}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="priser" className={styles.pricingSection}>
        <div className={styles.pricingCenter}>
          <div className={`${styles.sectionLabel} ${styles.reveal}`} data-reveal="" style={{ display: 'inline-block' }}>Priser</div>
          <h2 className={`${styles.sectionTitle} ${styles.reveal} ${styles.revealDelay1}`} data-reveal="">Enkla, transparenta priser</h2>
          <p className={`${styles.sectionSub} ${styles.reveal} ${styles.revealDelay2}`} data-reveal="" style={{ margin: '0 auto', textAlign: 'center' }}>Börja gratis. Uppgradera när du behöver mer.</p>
        </div>
        <div className={styles.pricingGrid}>
          <div className={`${styles.pricingCard} ${styles.reveal}`} data-reveal="">
            <div className={styles.pricingTier}>Gratis</div>
            <div className={styles.pricingPrice}>0 <sup>kr</sup></div>
            <div className={styles.pricingPeriod}>för alltid</div>
            <ul className={styles.pricingFeatures}>
              <li>2 CV-genereringar per månad</li>
              <li>2 personliga brev per månad</li>
              <li>Matchningsanalys</li>
              <li className="off">PDF-export</li>
              <li className="off">Ansökningsarkiv</li>
              <li className="off">Obegränsad användning</li>
            </ul>
            <a href={registerUrl} className={`${styles.btnPricing} ${styles.btnPricingOutline}`}>Kom igång gratis</a>
          </div>
          <div className={`${styles.pricingCard} ${styles.pricingFeatured} ${styles.reveal} ${styles.revealDelay1}`} data-reveal="">
            <div className={styles.pricingBadge}>MEST POPULÄRT</div>
            <div className={styles.pricingTier}>Pro</div>
            <div className={styles.pricingPrice}>109 <sup>kr</sup></div>
            <div className={styles.pricingPeriod}>per månad · avbryt när som helst</div>
            <ul className={styles.pricingFeatures}>
              <li>Obegränsade CV-genereringar</li>
              <li>Obegränsade personliga brev</li>
              <li>Matchningsanalys</li>
              <li>PDF-export i HD</li>
              <li>Fullständigt ansökningsarkiv</li>
              <li>Prioriterad support</li>
            </ul>
            <a href={registerUrl} className={`${styles.btnPricing} ${styles.btnPricingFill}`}>Starta Pro — 109 kr/mån</a>
          </div>
          <div className={`${styles.pricingCard} ${styles.pricingGreen} ${styles.reveal} ${styles.revealDelay2}`} data-reveal="">
            <div className={`${styles.pricingBadge} ${styles.pricingBadgeGreen}`}>BÄSTA VÄRDET</div>
            <div className={`${styles.pricingTier} ${styles.pricingTierGreen}`}>Pro Årsplan</div>
            <div className={`${styles.pricingPrice} ${styles.pricingPriceGreen}`}>83 <sup>kr</sup></div>
            <div className={styles.pricingPeriod}>per månad · <strong style={{ color: '#059669' }}>spara 309 kr/år</strong></div>
            <div style={{ fontSize: 13, color: '#64748B', marginBottom: 16 }}>Faktureras 999 kr/år</div>
            <ul className={styles.pricingFeatures}>
              <li>Obegränsade CV-genereringar</li>
              <li>Obegränsade personliga brev</li>
              <li>Matchningsanalys</li>
              <li>PDF-export i HD</li>
              <li>Fullständigt ansökningsarkiv</li>
              <li>Prioriterad support</li>
            </ul>
            <a href={registerUrl} className={`${styles.btnPricing} ${styles.btnPricingGreen}`}>Starta Årsplan — 999 kr/år</a>
          </div>
        </div>
        <p className={`${styles.pricingNote} ${styles.reveal}`} data-reveal="">Alla priser inkl. moms. Betalning via kort. Inga bindningstider.</p>
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Redo att landa ditt<br /><em>drömjobb?</em></h2>
        <p className={styles.ctaSub}>Skapa ditt konto gratis idag. Inget kreditkort krävs.</p>
        <a href={registerUrl} className={styles.btnHero}>Kom igång nu — det är gratis →</a>
        <p className={styles.ctaNote}>✓ Gratis för alltid &nbsp;·&nbsp; ✓ Inga bindningstider &nbsp;·&nbsp; ✓ GDPR-säkert</p>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <a href={`/${locale}`} className={styles.footerLogo}>CV<span>zume</span></a>
          <ul className={styles.footerLinks}>
            <li><a href="#hur">Hur det fungerar</a></li>
            <li><a href="#funktioner">Funktioner</a></li>
            <li><a href="#priser">Priser</a></li>
            <li><a href={authUrl}>Om oss</a></li>
            <li><a href={authUrl}>Kontakt</a></li>
            <li><a href="#">Integritetspolicy</a></li>
            <li><a href="#">Cookie-policy</a></li>
            <li><a href="#">Användarvillkor</a></li>
          </ul>
          <div className={styles.footerCopy}>© 2026 CVzume AB · Alla rättigheter förbehållna · Byggd i Sverige 🇸🇪</div>
        </div>
      </footer>
    </div>
  );
}