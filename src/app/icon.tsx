import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          background: 'linear-gradient(135deg, #0D1B2A 0%, #1a3a5c 100%)',
          borderRadius: 7,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
          fontWeight: 800,
          fontSize: 13,
          letterSpacing: -0.5,
        }}
      >
        <span style={{ color: '#ffffff' }}>C</span>
        <span style={{ color: '#93C5FD' }}>V</span>
      </div>
    ),
    { ...size }
  );
}
