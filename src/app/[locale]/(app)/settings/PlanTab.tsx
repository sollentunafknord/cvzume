import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './settings.module.css';

interface PlanInfo {
  plan: 'pro' | 'free';
  interval?: 'monthly' | 'yearly';
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  override?: boolean;
}

export default function PlanTab({ planInfo, planLoading }: {
  planInfo: PlanInfo | null;
  planLoading: boolean;
}) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations('settings');
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState('');

  async function openPortal() {
    setPortalLoading(true);
    setPortalError('');
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('cvita_token')}` },
        body: JSON.stringify({ locale }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error);
      window.location.assign(data.url);
    } catch {
      setPortalError(t('manage_subscription_error'));
      setPortalLoading(false);
    }
  }

  return (
    <div className={styles.settingsCard}>
      <div className={styles.cardHeader}>
        <div className={styles.cardHeaderIcon}>⚡</div>
        <div>
          <div className={styles.cardHeaderTitle}>Din plan</div>
          <div className={styles.cardHeaderDesc}>Nuvarande prenumeration</div>
        </div>
      </div>
      <div className={styles.cardBody}>
        {planLoading && <div style={{ color: 'var(--muted)', fontSize: 14 }}>Laddar planinformation...</div>}
        {!planLoading && planInfo?.plan === 'pro' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)' }}>
                  CVzume Pro <span className={styles.planBadgePro}>Pro</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>
                  {planInfo.interval === 'yearly' ? 'Årsplan' : 'Månadsplan'}
                  {planInfo.currentPeriodEnd && ` · Förnyas ${new Date(planInfo.currentPeriodEnd).toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' })}`}
                </div>
                {planInfo.cancelAtPeriodEnd && (
                  <div style={{ color: '#F97316', fontSize: 13, marginTop: 6 }}>⚠️ Avslutas vid periodens slut</div>
                )}
              </div>
            </div>
            {/* Manuell Pro (is_pro_override) har ingen Stripe-kund — då finns inget att hantera */}
            {!planInfo.override && (
              <div style={{ marginBottom: 20 }}>
                <button className={styles.btnPrimary} onClick={openPortal} disabled={portalLoading} style={{ fontSize: 13, padding: '8px 16px' }}>
                  {portalLoading ? t('manage_subscription_loading') : t('manage_subscription')}
                </button>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{t('manage_subscription_hint')}</div>
                {portalError && <div style={{ fontSize: 13, color: '#DC2626', marginTop: 6 }}>{portalError}</div>}
              </div>
            )}
            <div className={styles.planBenefits}>
              <div className={styles.planBenefitsTitle}>✅ Dina Pro-förmåner</div>
              <div className={styles.planBenefitsList}>
                <div>• Obegränsade CV-analyser</div>
                <div>• Obegränsade personliga brev</div>
                <div>• PDF-export</div>
                <div>• Prioriterad AI</div>
              </div>
            </div>
            {planInfo.interval === 'monthly' && (
              <div className={styles.planUpgradeHint}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#C2410C', marginBottom: 4 }}>💡 Spara med årsplan</div>
                <div style={{ fontSize: 13, color: '#9A3412' }}>Byt till årsplan och betala 999 SEK/år — spara 309 SEK!</div>
                <button className={styles.btnPrimary} style={{ marginTop: 12, fontSize: 13, padding: '8px 16px' }}
                  onClick={() => router.push(`/${locale}/upgrade`)}>Byt till årsplan</button>
              </div>
            )}
          </div>
        )}
        {!planLoading && planInfo?.plan !== 'pro' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--navy)' }}>
                  Gratis <span className={styles.planBadgeFree}>Gratis</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>2 CV-analyser per månad</div>
              </div>
              <button className={styles.btnPrimary} onClick={() => router.push(`/${locale}/upgrade`)}>⚡ Uppgradera till Pro</button>
            </div>
            <div className={styles.planUpgradeHint}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#C2410C', marginBottom: 8 }}>🚀 Vad du får med Pro</div>
              <div style={{ fontSize: 13, color: '#9A3412', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div>• Obegränsade CV-analyser</div>
                <div>• Obegränsade personliga brev</div>
                <div>• PDF-export</div>
                <div>• Prioriterad AI</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
