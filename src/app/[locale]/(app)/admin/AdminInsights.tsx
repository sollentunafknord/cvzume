'use client';

// Admin → Aktivite: kayıt/başvuru/mektup özeti, huni ve son 30 günün günlük grafikleri (/api/admin/stats).
import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-client';
import s from './insights.module.css';

type Period = { today: number; d7: number; d30: number; total: number };
type Day = { day: string; n: number };
type Data = {
  signups: Period; applications: Period; letters: Period; newProThisMonth: number;
  funnel: { registered: number; withCv: number; withApplication: number; pro: number };
  daily: { signups: Day[]; applications: Day[] };
};

const fmtDay = (d: string) => new Date(d + 'T12:00:00Z').toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });

function Tile({ label, p }: { label: string; p: Period }) {
  return (
    <div className={s.tile}>
      <div className={s.tileLabel}>{label} · son 30 gün</div>
      <div className={s.tileValue}>{p.d30}</div>
      <div className={s.tileSub}>Bugün {p.today} · 7 gün {p.d7} · toplam {p.total}</div>
    </div>
  );
}

// Tek seri sütun grafiği: ince sütunlar, 2px boşluk, üstte 4px yuvarlak; üzerine gelince gün ve sayı
function Columns({ title, data }: { title: string; data: Day[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 600, H = 150, PAD_B = 22, PAD_T = 18;
  const max = Math.max(1, ...data.map(d => d.n));
  const slot = W / data.length;
  const bw = Math.min(24, slot - 2);
  const y = (n: number) => PAD_T + (H - PAD_T - PAD_B) * (1 - n / max);
  const total = data.reduce((a, d) => a + d.n, 0);
  return (
    <figure className={s.chart}>
      <figcaption className={s.chartTitle}>{title}<span>{total} toplam · en yüksek {max}</span></figcaption>
      <div className={s.plot}>
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${title}: son 30 gün`} onMouseLeave={() => setHover(null)}>
          <line x1="0" x2={W} y1={H - PAD_B} y2={H - PAD_B} className={s.axis} />
          <text x="0" y="11" className={s.tick}>{max}</text>
          {data.map((d, i) => {
            const x = i * slot + (slot - bw) / 2, top = y(d.n), h = H - PAD_B - top;
            return (
              <g key={d.day} onMouseEnter={() => setHover(i)}>
                <rect x={i * slot} y={PAD_T} width={slot} height={H - PAD_T - PAD_B} fill="transparent" />
                {d.n > 0 && <path className={hover === i ? s.barOn : s.bar} d={`M${x},${H - PAD_B} V${top + 3} Q${x},${top} ${x + 3},${top} H${x + bw - 3} Q${x + bw},${top} ${x + bw},${top + 3} V${H - PAD_B} Z`} />}
                {h <= 0 && <rect x={x} y={H - PAD_B - 1} width={bw} height="1" className={s.zero} />}
              </g>
            );
          })}
          <text x="0" y={H - 6} className={s.tick}>{fmtDay(data[0].day)}</text>
          <text x={W} y={H - 6} textAnchor="end" className={s.tick}>Bugün</text>
        </svg>
        {hover !== null && (
          <div className={s.tip} style={{ left: `${((hover + 0.5) / data.length) * 100}%` }}>
            <strong>{data[hover].n}</strong> · {fmtDay(data[hover].day)}
          </div>
        )}
      </div>
    </figure>
  );
}

export default function AdminInsights() {
  const [d, setD] = useState<Data | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    authFetch('/api/admin/stats').then(async r => { if (!r.ok) throw new Error(String(r.status)); setD(await r.json()); }).catch(e => setErr(String(e.message || e)));
  }, []);

  if (err) return <p className={s.err}>İstatistikler yüklenemedi ({err}).</p>;
  if (!d) return <div className={s.loading}>İstatistikler yükleniyor…</div>;

  const f = d.funnel;
  const steps = [
    { label: 'Kayıt oldu', n: f.registered },
    { label: 'CV oluşturdu', n: f.withCv },
    { label: 'Başvuru hazırladı', n: f.withApplication },
    { label: 'Pro', n: f.pro },
  ];
  const base = Math.max(1, f.registered);

  return (
    <section className={s.wrap} aria-labelledby="insights-h">
      <h2 id="insights-h" className={s.h2}>Aktivite</h2>
      <div className={s.tiles}>
        <Tile label="Yeni kayıt" p={d.signups} />
        <Tile label="Hazırlanan başvuru" p={d.applications} />
        <Tile label="Yazılan mektup" p={d.letters} />
        <div className={s.tile}>
          <div className={s.tileLabel}>Yeni Pro · bu ay</div>
          <div className={s.tileValue}>{d.newProThisMonth}</div>
          <div className={s.tileSub}>Aktif Pro toplam {f.pro}</div>
        </div>
      </div>

      <div className={s.panel}>
        <div className={s.chartTitle}>Huni<span>kayıt olanların yüzdesi</span></div>
        <div className={s.funnel}>
          {steps.map(st => (
            <div key={st.label} className={s.fRow}>
              <div className={s.fLabel}>{st.label}</div>
              <div className={s.fTrack}><div className={s.fBar} style={{ width: `${(st.n / base) * 100}%` }} /></div>
              <div className={s.fNum}>{st.n}<span>{Math.round((st.n / base) * 100)}%</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className={s.charts}>
        <Columns title="Günlük kayıt" data={d.daily.signups} />
        <Columns title="Günlük başvuru" data={d.daily.applications} />
      </div>
      <details className={s.table}>
        <summary>Tablo olarak göster</summary>
        <table>
          <thead><tr><th>Gün</th><th>Kayıt</th><th>Başvuru</th></tr></thead>
          <tbody>{d.daily.signups.map((x, i) => <tr key={x.day}><td>{fmtDay(x.day)}</td><td>{x.n}</td><td>{d.daily.applications[i].n}</td></tr>).reverse()}</tbody>
        </table>
      </details>
    </section>
  );
}
