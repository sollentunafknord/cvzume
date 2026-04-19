import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';

const LANGS = [
  { code: 'sv', flagImg: 'https://flagcdn.com/20x15/se.png', name: 'Svenska', sub: 'Gränssnittet visas på svenska' },
  { code: 'en', flagImg: 'https://flagcdn.com/20x15/gb.png', name: 'English', sub: 'Interface displayed in English' },
  { code: 'es', flagImg: 'https://flagcdn.com/20x15/es.png', name: 'Español', sub: 'La interfaz se muestra en español' },
  { code: 'tr', flagImg: 'https://flagcdn.com/20x15/tr.png', name: 'Türkçe', sub: 'Arayüz Türkçe görüntülenir' },
];

export default function LanguageTab() {
  const locale = useLocale();
  const router = useRouter();

  function changeLanguage(code: string) {
    localStorage.setItem('cvita_language', code);
    router.push(`/${code}/settings`);
  }

  return (
    <div className={styles.settingsCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderIcon}>🌐</div>
        <div>
          <div className={styles.cardHeaderTitle}>Språk / Language / Dil</div>
          <div className={styles.cardHeaderDesc}>Välj vilket språk gränssnittet visas på</div>
        </div>
      </div>
      <div className={styles.cardBody}>
        <div className={styles.langOptions}>
          {LANGS.map(lang => (
            <button key={lang.code} className={`${styles.langOptionBtn} ${locale === lang.code ? styles.active : ''}`}
              onClick={() => changeLanguage(lang.code)}>
              <img src={lang.flagImg} alt={lang.name} style={{ width: 24, height: 18, borderRadius: 2 }} />
              <div>
                <div className={styles.langName}>{lang.name}</div>
                <div className={styles.langSub}>{lang.sub}</div>
              </div>
              <span className={styles.langCheck}>{locale === lang.code ? '✓' : ''}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
