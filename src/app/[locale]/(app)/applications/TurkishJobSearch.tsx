'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './applications.module.css';

const ISKUR_URL = 'https://esube.iskur.gov.tr/Istihdam/AcikIsIlanAra.aspx';

interface Province { value: string; label: string; }
interface District { value: string; label: string; }
interface IskurJob {
  id: string;
  title: string;
  workType: string;
  openings: string;
  location: string;
  ilanNo: string;
  deadline: string;
  remaining: string;
  url: string;
}

export default function TurkishJobSearch() {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selIl, setSelIl] = useState('');
  const [selIlce, setSelIlce] = useState('');
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobs, setJobs] = useState<IskurJob[]>([]);
  const [searched, setSearched] = useState(false);
  const [blocked, setBlocked] = useState(false);

  // For client-side form submission to İŞKUR (bypasses WAF since request comes from browser)
  const [formData, setFormData] = useState<{ viewState: string; viewStateGenerator: string; eventValidation: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!selIl) return;
    setLoadingJobs(true);
    setSearched(true);
    setJobs([]);
    setBlocked(false);
    try {
      const params = new URLSearchParams({ action: 'search', il: selIl });
      if (selIlce) params.set('ilce', selIlce);
      const res = await fetch(`/api/jobs/iskur?${params}`);
      const data = await res.json();
      if (!data.blocked && data.jobs?.length > 0) {
        setJobs(data.jobs);
      } else {
        setBlocked(true);
        // Fetch ViewState for browser-side form submission
        fetch('/api/jobs/iskur?action=formdata')
          .then(r => r.json())
          .then(fd => {
            if (fd.viewState) setFormData(fd);
          })
          .catch(() => {});
      }
    } catch {
      setBlocked(true);
    } finally {
      setLoadingJobs(false);
    }
  }

  function openInIskur() {
    if (formRef.current) {
      formRef.current.submit();
    } else {
      window.open(ISKUR_URL, '_blank', 'noopener');
    }
  }

  const selectedProvLabel = provinces.find(p => p.value === selIl)?.label || '';

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
            <div style={sectionSub}>Resmi devlet iş ilanları — il ve ilçe seçerek arayın</div>
          </div>
        </div>

        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px' }}>
            <label style={labelStyle}>İl *</label>
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
            type="submit"
            style={{ ...btnRed, opacity: !selIl || loadingJobs ? 0.6 : 1, cursor: !selIl || loadingJobs ? 'default' : 'pointer' }}
            disabled={!selIl || loadingJobs}
          >
            {loadingJobs ? '⏳ Aranıyor...' : '🔍 İlanları Göster'}
          </button>
        </form>

        {/* Results */}
        {searched && !loadingJobs && (
          <div style={{ marginTop: 16 }}>
            {blocked ? (
              <div style={blockedBox}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                  İlanlar İŞKUR'da açılacak
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
                  {selectedProvLabel && <><strong>{selectedProvLabel}</strong> ilindeki ilanlar İŞKUR'un resmi sitesinde görüntülenecek.</>}
                </div>
                <button onClick={openInIskur} style={btnRed}>
                  İŞKUR'da İlanları Gör →
                </button>
                {/* Hidden form for browser-side POST to İŞKUR — bypasses WAF */}
                {formData && (
                  <form ref={formRef} method="post" action={ISKUR_URL} target="_blank" style={{ display: 'none' }}>
                    <input type="hidden" name="__EVENTTARGET" value="ctl04$ctlAcikIsPageCommand$CommandItem_Search" />
                    <input type="hidden" name="__EVENTARGUMENT" value="" />
                    <input type="hidden" name="__VIEWSTATE" value={formData.viewState} />
                    <input type="hidden" name="__VIEWSTATEGENERATOR" value={formData.viewStateGenerator} />
                    <input type="hidden" name="__EVENTVALIDATION" value={formData.eventValidation} />
                    <input type="hidden" name="__VIEWSTATEENCRYPTED" value="" />
                    <input type="hidden" name="ctl04$ctlIl" value={selIl} />
                    <input type="hidden" name="ctl04$ctlIlce" value={selIlce || '0'} />
                    <input type="hidden" name="ctl04$IsyeriTuruRadios" value="1" />
                  </form>
                )}
              </div>
            ) : jobs.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--slate)', fontSize: 14 }}>
                Bu bölgede şu an aktif ilan bulunamadı.
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 13, color: 'var(--slate)', marginBottom: 12 }}>
                  <strong>{jobs.length}</strong> ilan bulundu
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {jobs.map(job => (
                    <div key={job.id} style={jobRow}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{job.title}</div>
                          {job.remaining && (
                            <span style={{ fontSize: 11, color: job.remaining.includes('Saat') ? '#DC2626' : '#64748B', whiteSpace: 'nowrap', flexShrink: 0 }}>
                              ⏰ {job.remaining}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--slate)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          {job.location && <span>📍 {job.location.replace('İlçe Geneli Başvuru', '').replace('Çalışma Yeri:', '').trim()}</span>}
                          {job.workType && <span>💼 {job.workType}</span>}
                          {job.openings && <span>👥 {job.openings} pozisyon</span>}
                          {job.deadline && <span>Son: {job.deadline}</span>}
                        </div>
                        {job.ilanNo && (
                          <div style={{ marginTop: 6 }}>
                            <a href={job.url} target="_blank" rel="noopener noreferrer"
                              style={{ fontSize: 12, color: '#E30613', textDecoration: 'none', fontWeight: 600 }}>
                              İlan #{job.ilanNo} → Detay
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, fontSize: 12, color: 'var(--slate)' }}>
                  Detaylar için{' '}
                  <a href={ISKUR_URL} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>
                    İŞKUR sitesini ziyaret edin
                  </a>
                </div>
              </div>
            )}
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

const btnRedLink: React.CSSProperties = {
  display: 'inline-block',
  padding: '9px 18px',
  background: '#E30613',
  color: 'white',
  textDecoration: 'none',
  borderRadius: 9,
  fontSize: 14,
  fontWeight: 600,
};

const blockedBox: React.CSSProperties = {
  background: '#FFF7ED',
  border: '1px solid #FED7AA',
  borderRadius: 10,
  padding: '16px 18px',
  color: '#92400E',
};

const jobRow: React.CSSProperties = {
  padding: '12px 14px',
  background: '#F8FAFC',
  border: '1px solid var(--border)',
  borderRadius: 10,
  display: 'flex',
  alignItems: 'center',
  gap: 12,
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
