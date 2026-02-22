import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'StrivPath — Track your athletic goals';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  return new ImageResponse(
    <div
      style={{
        background: '#fafafa',
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '80px',
        gap: '64px',
        fontFamily: 'sans-serif',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`${appUrl}/logo.svg`} width={220} height={220} alt="StrivPath logo" />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div
          style={{
            color: '#0a0a0a',
            fontSize: '80px',
            fontWeight: 900,
            letterSpacing: '-3px',
            lineHeight: 1,
          }}
        >
          StrivPath
        </div>
        <div
          style={{
            color: '#666666',
            fontSize: '28px',
            lineHeight: 1.5,
            maxWidth: '580px',
          }}
        >
          Set meaningful goals. Follow your journey. Celebrate every milestone.
        </div>
      </div>
    </div>,
    { ...size },
  );
}
