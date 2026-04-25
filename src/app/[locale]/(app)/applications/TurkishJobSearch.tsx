'use client';

import { useState, useEffect } from 'react';
import styles from './applications.module.css';

const ISKUR_URL = 'https://esube.iskur.gov.tr/Istihdam/AcikIsIlanAra.aspx';

interface Province { value: string; label: string; }
interface District { value: string; label: string; }

export default function TurkishJobSearch() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selIl, setSelIl] = useState('');
  const [selIlce, setSelIlce] = useState('');
  const [loadingProvinces, setLoadingProvinces] = useState(true);

  useEffect(() => {
    fetch('/api/jobs/iskur?action=provinces')
      .then(r => r.json())
      .then(data => setProvinces(data.provinces || []))
      .catch(() => setProvinces([]))
      .finally(() => setLoadingProvinces(false));
  }, []);

  async function onIlChange(val: string) {
    setSelIl(val);
    setSelIlce('');
    setDistricts([]);
    if (!val) return;
    try {
      const res = await fetch(`/api/jobs/iskur?action=districts&il=${encodeURIComponent(val)}`);
      const data = await res.json();
      setDistricts(data.districts || []);
    } catch {
      setDistricts([]);
    }
  }

  function openInIskur() {
    window.open(ISKUR_URL, '_blank', 'noopener');
  }

  const selectedProvLabel = provinces.find(p => p.value === selIl)?.label || '';
  const selectedDistLabel = districts.find(d => d.value === selIlce)?.label || '';

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>İş İlanları</h1>
        <p className={styles.subtitle}>Türkiye'deki iş ilanlarını arayın</p>
      </div>

      {/* İŞKUR Search */}
      <div style={sectionCard}>
        <div style={sectionHeader}>
          <div style={{ ...logoBox, background: '#E30613' }}>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 800 }}>İŞKUR</span>
          </div>
          <div>
            <div style={sectionTitle}>Türkiye İş Kurumu</div>
            <div style={sectionSub}>Resmi devlet iş ilanları — il ve ilçe seçerek İŞKUR'da arayın</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px' }}>
            <label style={labelStyle}>İl</label>
            <select
              style={selectStyle}
              value={selIl}
              onChange={e => onIlChange(e.target.value)}
              disabled={loadingProvinces}
            >
              <option value="">{loadingProvinces ? 'Yükleniyor...' : 'İl seçin'}</option>
              {provinces.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px' }}>
            <label style={labelStyle}>İlçe (isteğe bağlı)</label>
            <select
              style={selectStyle}
              value={selIlce}
              onChange={e => setSelIlce(e.target.value)}
              disabled={!selIl}
            >
              <option value="">Tüm ilçeler</option>
              {districts.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={openInIskur}
            style={{ ...btnRed, opacity: !selIl ? 0.6 : 1, cursor: !selIl ? 'default' : 'pointer' }}
            disabled={!selIl}
          >
            İŞKUR'da Ara →
          </button>
        </div>

        {selIl && (
          <div style={infoBox}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              {selectedProvLabel}{selectedDistLabel ? ` › ${selectedDistLabel}` : ''} için ilanlar açılıyor
            </div>
            <div style={{ fontSize: 12, color: '#92400E', lineHeight: 1.6 }}>
              İŞKUR sitesi yeni sekmede açılacak. Site açıldıktan sonra aynı il
              {selectedDistLabel ? '/ilçe' : ''} seçimini yapıp arama yapabilirsiniz.
            </div>
          </div>
        )}
      </div>

      {/* Other sites as link cards */}
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--slate)', marginBottom: 10 }}>
          Diğer platformlar
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <a href="https://www.kariyer.net/is-ilanlari" target="_blank" rel="noopener noreferrer" style={linkCard}>
            <div style={{ ...logoBox, background: '#FF6600', width: 36, height: 36 }}>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 800 }}>K</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Kariyer.net</div>
              <div style={{ fontSize: 11, color: 'var(--slate)' }}>Türkiye'nin en büyük iş portalı →</div>
            </div>
          </a>
          <a href="https://www.yenibiris.com" target="_blank" rel="noopener noreferrer" style={linkCard}>
            <div style={{ ...logoBox, background: '#0099CC', width: 36, height: 36 }}>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 800 }}>Y</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Yeni Bir İş</div>
              <div style={{ fontSize: 11, color: 'var(--slate)' }}>yenibiris.com →</div>
            </div>
          </a>
          <a href="https://tr.indeed.com" target="_blank" rel="noopener noreferrer" style={linkCard}>
            <div style={{ ...logoBox, background: '#2164F3', width: 36, height: 36 }}>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 800 }}>in</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>Indeed Türkiye</div>
              <div style={{ fontSize: 11, color: 'var(--slate)' }}>tr.indeed.com →</div>
            </div>
          </a>
          <a href="https://www.linkedin.com/jobs/search/?location=Turkey" target="_blank" rel="noopener noreferrer" style={linkCard}>
            <div style={{ ...logoBox, background: '#0A66C2', width: 36, height: 36 }}>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 800 }}>in</span>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>LinkedIn Jobs</div>
              <div style={{ fontSize: 11, color: 'var(--slate)' }}>linkedin.com →</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}

const sectionCard: React.CSSProperties = {
  background: 'white',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 24,
  marginBottom: 16,
};

const sectionHeader: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 18,
};

const sectionTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--navy)',
};

const sectionSub: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--slate)',
};

const logoBox: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--navy)',
};

const selectStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1.5px solid var(--border)',
  fontSize: 14,
  fontFamily: 'DM Sans, sans-serif',
  color: 'var(--navy)',
  background: 'white',
  minWidth: 160,
};

const btnRed: React.CSSProperties = {
  padding: '9px 18px',
  background: '#E30613',
  color: 'white',
  border: 'none',
  borderRadius: 9,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'DM Sans, sans-serif',
  cursor: 'pointer',
  height: 38,
  alignSelf: 'flex-end',
  whiteSpace: 'nowrap',
};

const infoBox: React.CSSProperties = {
  marginTop: 14,
  background: '#FFF7ED',
  border: '1px solid #FED7AA',
  borderRadius: 10,
  padding: '12px 16px',
  color: '#92400E',
};

const linkCard: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '12px 16px',
  background: 'white',
  border: '1px solid var(--border)',
  borderRadius: 12,
  textDecoration: 'none',
  flex: '1 1 180px',
  minWidth: 0,
  transition: 'border-color 0.15s',
};
