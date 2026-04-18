import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          background: 'linear-gradient(135deg, #0D1B2A 0%, #1a3a5c 100%)',
          borderRadius: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          fontWeight: 800,
          fontSize: 72,
          letterSpacing: -3,
        }}
      >
        <span style={{ color: '#ffffff' }}>C</span>
        <span style={{ color: '#93C5FD' }}>V</span>
      </div>
    ),
    { ...size }
  );
}
