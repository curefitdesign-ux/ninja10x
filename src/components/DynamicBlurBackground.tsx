import { memo } from 'react';

interface DynamicBlurBackgroundProps {
  imageUrl: string;
  children: React.ReactNode;
}

const DynamicBlurBackground = memo(function DynamicBlurBackground({ imageUrl, children }: DynamicBlurBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#0a0a14' }}>
      {/* Moody ambient gradient — dark purples, mauves, warm earth tones */}
      <div className="absolute overflow-hidden" style={{ top: -50, bottom: -50, left: -50, right: -50 }}>
        <div
          className="absolute inset-0"
          style={{
            background: [
              'radial-gradient(ellipse at 25% 15%, hsla(220, 30%, 28%, 0.7) 0%, transparent 50%)',
              'radial-gradient(ellipse at 75% 10%, hsla(270, 35%, 22%, 0.8) 0%, transparent 45%)',
              'radial-gradient(ellipse at 15% 50%, hsla(20, 20%, 30%, 0.5) 0%, transparent 50%)',
              'radial-gradient(ellipse at 80% 60%, hsla(250, 25%, 25%, 0.6) 0%, transparent 50%)',
              'radial-gradient(ellipse at 50% 85%, hsla(240, 20%, 18%, 0.7) 0%, transparent 50%)',
              'radial-gradient(ellipse at 60% 40%, hsla(280, 20%, 22%, 0.4) 0%, transparent 55%)',
              'linear-gradient(155deg, hsl(230, 25%, 12%) 0%, hsl(260, 20%, 10%) 35%, hsl(280, 18%, 14%) 60%, hsl(220, 22%, 10%) 100%)',
            ].join(', '),
          }}
        />

        {/* Noise / grain texture */}
        <div
          className="absolute inset-0 opacity-[0.22] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
        />

        {/* Soft vignette */}
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(8, 8, 18, 0.45) 100%)',
          }}
        />
      </div>

      {/* Children content */}
      {children}
    </div>
  );
});

export default DynamicBlurBackground;