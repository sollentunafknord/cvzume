'use client';

// Admin → İndirim kodları: yeni kod (oran, süre, bitiş, kullanım sınırı), listedeki kodun oranını değiştir ya da kapat.
// Müşteri kodu Stripe ödeme sayfasındaki "Promosyon kodu ekle" alanına yazar.
import { useCallback, useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-client';
import s from './promo.module.css';

type Code = { id: string; code: string; active: boolean; percent: number | null; duration: string | null; months: number | null; expiresAt: string | null; expired: boolean; maxRedemptions: number | null; redeemed: number; created: string };

const MONTHS_TR = ['OCAK', 'SUBAT', 'MART', 'NISAN', 'MAYIS', 'HAZIRAN', 'TEMMUZ', 'AGUSTOS', 'EYLUL', 'EKIM', 'KASIM', 'ARALIK'];
// Ayın son günü, yerel tarih olarak (toISOString UTC'ye çevirip bir gün geri kaydırıyordu)
const lastOfMonth = () => { const d = new Date(); const last = new Date(d.getFullYear(), d.getMonth() + 1, 0); return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`; };
const durationText = (c: Code) => c.duration === 'forever' ? 'her ödemede' : c.duration === 'repeating' ? `ilk ${c.months} ay` : 'ilk ödemede';
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'süresiz');

function Row({ c, onChanged }: { c: Code; onChanged: () => void }) {
  const [pct, setPct] = useState(String(c.percent ?? ''));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const send = async (body: object) => {
    setBusy(true); setErr('');
    const r = await authFetch('/api/admin/promo', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: c.id, ...body }) }).catch(() => null);
    const d = await r?.json().catch(() => ({}));
    setBusy(false);
    if (!r?.ok) { setErr(d?.error || 'Olmadı'); return; }
    onChanged();
  };
  const expired = c.expired;
  return (
    <tr className={c.active && !expired ? '' : s.off}>
      <td><strong className={s.code}>{c.code}</strong>{!c.active ? <span className={s.tag}>kapalı</span> : expired ? <span className={s.tag}>süresi doldu</span> : null}</td>
      <td>
        {c.active && !expired ? (
          <span className={s.pctEdit}>%<input type="number" min={1} max={100} value={pct} onChange={e => setPct(e.target.value)} aria-label={`${c.code} indirim oranı`} />
            {Number(pct) !== c.percent && <button disabled={busy} onClick={() => send({ percent: Number(pct) })}>Kaydet</button>}</span>
        ) : <>%{c.percent}</>}
      </td>
      <td>{durationText(c)}</td>
      <td>{fmtDate(c.expiresAt)}</td>
      <td>{c.redeemed}{c.maxRedemptions ? ` / ${c.maxRedemptions}` : ''}</td>
      <td>{c.active ? <button className={s.ghost} disabled={busy} onClick={() => send({ active: false })}>Kapat</button>
        : !expired && <button className={s.ghost} disabled={busy} onClick={() => send({ active: true })}>Aç</button>}
        {err && <div className={s.err}>{err}</div>}</td>
    </tr>
  );
}

export default function AdminPromo() {
  const [codes, setCodes] = useState<Code[] | null>(null);
  const [loadErr, setLoadErr] = useState('');
  const [form, setForm] = useState({ code: `${MONTHS_TR[new Date().getMonth()]}${String(new Date().getFullYear()).slice(2)}`, percent: '20', duration: 'once', months: '3', expiresAt: lastOfMonth(), max: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const r = await authFetch('/api/admin/promo').catch(() => null);
    const d = await r?.json().catch(() => ({}));
    if (!r?.ok) { setLoadErr(d?.error || 'Kodlar yüklenemedi'); return; }
    setLoadErr(''); setCodes(d.codes);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- ilk yükleme; state yanıt gelince güncellenir
  useEffect(() => { load(); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg('');
    const r = await authFetch('/api/admin/promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      code: form.code, percent: Number(form.percent), duration: form.duration, months: Number(form.months), expiresAt: form.expiresAt || undefined, maxRedemptions: form.max ? Number(form.max) : null,
    }) }).catch(() => null);
    const d = await r?.json().catch(() => ({}));
    setBusy(false);
    if (!r?.ok) { setMsg(`✗ ${d?.error || 'Olmadı'}`); return; }
    setMsg(`✓ ${d.code.code} oluşturuldu: %${d.code.percent} indirim`);
    load();
  };
  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm(v => ({ ...v, [k]: k === 'code' ? e.target.value.toUpperCase() : e.target.value }));

  return (
    <section className={s.wrap} aria-labelledby="promo-h">
      <h2 id="promo-h" className={s.h2}>İndirim kodları</h2>
      <p className={s.note}>Müşteri kodu Pro&apos;ya geçerken ödeme sayfasındaki <strong>“Promosyon kodu ekle”</strong> alanına yazar. Oran listeden istediğiniz zaman değiştirilebilir.</p>

      <form className={s.form} onSubmit={create}>
        <label>Kod<input value={form.code} onChange={f('code')} required pattern="[A-Za-z0-9_\-]{3,30}" /></label>
        <label>İndirim %<input type="number" min={1} max={100} value={form.percent} onChange={f('percent')} required /></label>
        <label>Geçerli olduğu ödeme
          <select value={form.duration} onChange={f('duration')}>
            <option value="once">Sadece ilk ödeme</option>
            <option value="repeating">İlk birkaç ay</option>
            <option value="forever">Her ödeme (abonelik boyunca)</option>
          </select></label>
        {form.duration === 'repeating' && <label>Kaç ay<input type="number" min={1} max={36} value={form.months} onChange={f('months')} /></label>}
        <label>Son kullanma<input type="date" value={form.expiresAt} onChange={f('expiresAt')} /></label>
        <label>Kullanım sınırı<input type="number" min={1} placeholder="sınırsız" value={form.max} onChange={f('max')} /></label>
        <button className={s.primary} disabled={busy}>{busy ? 'Oluşturuluyor…' : 'Kodu oluştur'}</button>
      </form>
      {msg && <p className={msg.startsWith('✓') ? s.ok : s.err} role="status">{msg}</p>}

      {loadErr ? <p className={s.err}>{loadErr}</p> : !codes ? <p className={s.note}>Yükleniyor…</p> : codes.length === 0 ? <p className={s.note}>Henüz kod yok.</p> : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead><tr><th>Kod</th><th>İndirim</th><th>Geçerli</th><th>Son gün</th><th>Kullanım</th><th /></tr></thead>
            <tbody>{codes.map(c => <Row key={c.id} c={c} onChanged={load} />)}</tbody>
          </table>
        </div>
      )}
    </section>
  );
}
