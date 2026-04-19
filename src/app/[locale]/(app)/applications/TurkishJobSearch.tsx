'use client';

import { useState } from 'react';
import styles from './applications.module.css';

export default function TurkishJobSearch() {
  const [query, setQuery] = useState('');

  function openIskur(e: React.FormEvent) {
    e.preventDefault();
    const base = 'https://esube.iskur.gov.tr/Istihdam/AcikIsIlanAra.aspx';
    window.open(base, '_blank', 'noopener');
  }

  function openKariyer(e: React.MouseEvent) {
    e.preventDefault();
    const url = query.trim()
      ? `https://www.kariyer.net/is-ilanlari?q=${encodeURIComponent(query.trim())}`
      : 'https://www.kariyer.net/is-ilanlari';
    window.open(url, '_blank', 'noopener');
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>İş İlanları</h1>
        <p className={styles.subtitle}>Türkiye'deki iş ilanlarını aşağıdaki platformlar üzerinden arayın</p>
      </div>

      <form className={styles.filters} onSubmit={openIskur}>
        <div className={styles.searchRow}>
          <input
            className={styles.searchInput}
            placeholder="Pozisyon, şirket veya anahtar kelime..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </form>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* İŞKUR Card */}
        <div style={cardStyle}>
          <div style={logoRow}>
            <div style={{ ...logoBox, background: '#E30613' }}>
              <span style={{ color: 'white', fontSize: 13, fontWeight: 800, letterSpacing: -0.5 }}>İŞKUR</span>
            </div>
            <div>
              <div style={cardTitle}>Türkiye İş Kurumu</div>
              <div style={cardSub}>Resmi devlet iş ilanları portalı</div>
            </div>
          </div>
          <p style={cardDesc}>
            Türkiye'nin resmi istihdam kurumunun iş ilanları. Kamu ve özel sektör ilanları, staj fırsatları ve mesleki eğitimler.
          </p>
          <div style={tagRow}>
            <span style={tag}>Ücretsiz</span>
            <span style={tag}>Resmi</span>
            <span style={tag}>Tüm Türkiye</span>
          </div>
          <button style={btnPrimary} onClick={openIskur}>
            İŞKUR'da Ara →
          </button>
        </div>

        {/* Kariyer.net Card */}
        <div style={cardStyle}>
          <div style={logoRow}>
            <div style={{ ...logoBox, background: '#FF6600' }}>
              <span style={{ color: 'white', fontSize: 11, fontWeight: 800 }}>kariyer</span>
            </div>
            <div>
              <div style={cardTitle}>Kariyer.net</div>
              <div style={cardSub}>Türkiye'nin en büyük iş ilanı sitesi</div>
            </div>
          </div>
          <p style={cardDesc}>
            13 milyonun üzerinde aylık ziyaretçisiyle Türkiye'nin lider iş arama platformu. Binlerce şirket ve pozisyon.
          </p>
          <div style={tagRow}>
            <span style={tag}>13M+ ziyaretçi</span>
            <span style={tag}>Özel sektör</span>
            <span style={tag}>Anahtar kelime arama</span>
          </div>
          <button style={btnOrange} onClick={openKariyer}>
            {query.trim() ? `"${query}" için Kariyer.net'te Ara →` : 'Kariyer.net\'te Ara →'}
          </button>
        </div>
      </div>

      <div style={{ marginTop: 24, padding: '14px 18px', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, fontSize: 13, color: '#1E40AF', lineHeight: 1.6 }}>
        💡 <strong>İpucu:</strong> Yukarıya arama terimi gir, ardından hangi platformda aramak istediğini seç. Sonuçlar yeni sekmede açılır.
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  flex: '1 1 300px',
  background: 'white',
  border: '1px solid var(--border)',
  borderRadius: 16,
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
};

const logoRow: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 4,
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

const cardTitle: React.CSSProperties = {
  fontSize: 15,
  fontWeight: 700,
  color: 'var(--navy)',
};

const cardSub: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--slate)',
};

const cardDesc: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--slate)',
  lineHeight: 1.6,
  margin: 0,
};

const tagRow: React.CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
};

const tag: React.CSSProperties = {
  background: '#F1F5F9',
  color: 'var(--slate)',
  fontSize: 11,
  fontWeight: 500,
  padding: '3px 8px',
  borderRadius: 20,
};

const btnPrimary: React.CSSProperties = {
  padding: '10px 16px',
  background: '#E30613',
  color: 'white',
  border: 'none',
  borderRadius: 9,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'DM Sans, sans-serif',
  cursor: 'pointer',
  marginTop: 'auto',
};

const btnOrange: React.CSSProperties = {
  padding: '10px 16px',
  background: '#FF6600',
  color: 'white',
  border: 'none',
  borderRadius: 9,
  fontSize: 14,
  fontWeight: 600,
  fontFamily: 'DM Sans, sans-serif',
  cursor: 'pointer',
  marginTop: 'auto',
};
