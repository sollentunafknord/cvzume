// CVzume logo simgesi (C2): koyu kare zeminde arkada ilan (açık mavi), önde CV (beyaz).
// onDark: koyu zeminlerde (sidebar, koyu paneller) kare kaybolmasın diye ince açık kenar.
export default function LogoMark({ size = 28, onDark = false }: { size?: number; onDark?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <rect x={onDark ? 1 : 0} y={onDark ? 1 : 0} width={onDark ? 62 : 64} height={onDark ? 62 : 64} rx="15" fill="#0D1B2A"
        stroke={onDark ? 'rgba(255,255,255,0.22)' : 'none'} strokeWidth={onDark ? 2 : 0} />
      <rect x="14" y="16" width="22" height="30" rx="3.5" fill="#93C5FD" transform="rotate(-10 25 31)" />
      <rect x="27" y="17" width="22" height="30" rx="3.5" fill="#fff" transform="rotate(8 38 32)" />
      <g transform="rotate(8 38 32)" fill="#1A56DB">
        <rect x="31" y="24" width="12" height="2.8" rx="1.4" />
        <rect x="31" y="30" width="14" height="2.8" rx="1.4" />
        <rect x="31" y="36" width="9" height="2.8" rx="1.4" />
      </g>
    </svg>
  );
}
