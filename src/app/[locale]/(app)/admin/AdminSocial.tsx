'use client';

// Admin → Paylaşım hazırlığı: Facebook gruplarına ve Instagram'a elle paylaşmak için hazır görsel + metin.
// Gruplara otomatik paylaşım yok (Meta Groups API 2024'te kapandı); sayfa/Instagram/Forum İsveç cron'la gidiyor.
/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import { TIPS, type SocialLang } from '@/lib/social/tips';
import { GROUPS } from '@/lib/social/groups';
import { cardPath, forumCaption, forumInstagram, forumText, groupText, pageCaption, today } from '@/lib/social/posts';
import s from './social.module.css';

type Target = SocialLang | 'forum';
const TARGETS: { key: Target; label: string }[] = [
  { key: 'sv', label: '🇸🇪 Svenska' }, { key: 'en', label: '🇬🇧 English' }, { key: 'de', label: '🇩🇪 Deutsch' },
  { key: 'es', label: '🇪🇸 Español' }, { key: 'tr', label: '🇹🇷 Türkçe' }, { key: 'forum', label: '🇸🇪🇹🇷 Forum İsveç' },
];

function CopyBox({ title, text }: { title: string; text: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* izin yok */ }
  };
  return (
    <div className={s.box}>
      <div className={s.boxHead}><strong>{title}</strong><button className={s.copy} onClick={copy}>{done ? '✓ Kopyalandı' : 'Kopyala'}</button></div>
      <pre className={s.text}>{text}</pre>
    </div>
  );
}

export default function AdminSocial() {
  const start = TIPS.indexOf(today().tip);
  const [i, setI] = useState(start);
  const [target, setTarget] = useState<Target>(today().pageLang);
  const tip = TIPS[i];
  const forum = target === 'forum';
  const lang: SocialLang = forum ? 'tr' : target;
  const img = cardPath(tip, lang, forum);
  const title = forum ? forumText(tip).title : tip[lang].title;
  const step = (d: number) => setI(v => (v + d + TIPS.length) % TIPS.length);

  return (
    <section className={s.wrap} aria-labelledby="social-h">
      <div className={s.head}>
        <h2 id="social-h" className={s.h2}>Paylaşım hazırlığı</h2>
        <div className={s.nav}>
          <button onClick={() => step(-1)} aria-label="Önceki ipucu">←</button>
          <select value={i} onChange={e => setI(Number(e.target.value))} aria-label="İpucu">
            {TIPS.map((t, k) => <option key={t.id} value={k}>{k + 1}. {t.tr.title}{k === start ? ' (bugün)' : ''}</option>)}
          </select>
          <button onClick={() => step(1)} aria-label="Sonraki ipucu">→</button>
          {i !== start && <button onClick={() => setI(start)}>Bugün</button>}
        </div>
      </div>
      <p className={s.note}>Sayfa, Instagram ve Forum İsveç her sabah otomatik paylaşılıyor. Buradakiler elle paylaşım için: Facebook grupları, hikâyeler ya da ek gönderiler.</p>

      <div className={s.tabs} role="tablist">
        {TARGETS.map(t => <button key={t.key} role="tab" aria-selected={target === t.key} onClick={() => setTarget(t.key)}>{t.label}</button>)}
      </div>

      <div className={s.grid}>
        <div className={s.imgCol}>
          <img src={img} alt={title} className={s.img} />
          <a className={s.download} href={img} download={`cvzume-${tip.id}-${forum ? 'forum' : lang}.jpg`}>Görseli indir (1080×1350)</a>
        </div>
        <div className={s.textCol}>
          <CopyBox title={forum ? 'Facebook (Forum İsveç)' : 'Facebook (grup ya da sayfa)'} text={forum ? forumCaption(tip) : groupText(tip, lang)} />
          <CopyBox title="Instagram" text={forum ? forumInstagram(tip) : pageCaption(tip, lang, 'instagram')} />
          {!forum && (
            <div className={s.box}>
              <div className={s.boxHead}><strong>Önerilen gruplar</strong></div>
              <ul className={s.groups}>{GROUPS[lang].map(g => <li key={g.url}><a href={g.url} target="_blank" rel="noopener noreferrer">{g.name} ↗</a></li>)}</ul>
              <p className={s.note}>Günde 2–3 grup yeter; aynı metni aynı gün birden çok gruba atmayın.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
