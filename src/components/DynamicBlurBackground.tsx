import { useState, useEffect, useRef } from 'react';

interface DynamicBlurBackgroundProps {
  imageUrl: string;
  children: React.ReactNode;
}

export default function DynamicBlurBackground({ imageUrl, children }: DynamicBlurBackgroundProps) {
  // Two-layer crossfade: layer A and B alternate as "front"
  const [layers, setLayers] = useState<[string, string]>([imageUrl, '']);
  const [frontLayer, setFrontLayer] = useState<'a' | 'b'>('a');
  const prevUrlRef = useRef(imageUrl);

  useEffect(() => {
    if (imageUrl === prevUrlRef.current) return;
    prevUrlRef.current = imageUrl;

    // Put new image on the back layer, then crossfade
    if (frontLayer === 'a') {
      setLayers(prev => [prev[0], imageUrl]);
      // Small RAF delay so browser paints the new layer at opacity 0 first
      requestAnimationFrame(() => setFrontLayer('b'));
    } else {
      setLayers(prev => [imageUrl, prev[1]]);
      requestAnimationFrame(() => setFrontLayer('a'));
    }
  }, [imageUrl, frontLayer]);

  const layerStyle = (url: string, isFront: boolean): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    backgroundImage: url ? `url(${url})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(60px) saturate(120%)',
    transform: 'scale(1.2)',
    opacity: isFront ? 1 : 0,
    transition: 'opacity 0.6s ease-in-out',
    willChange: 'opacity',
  });

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ height: '100dvh' }}>
      {/* Crossfading blurred backgrounds */}
      <div className="absolute inset-0">
        <div style={layerStyle(layers[0], frontLayer === 'a')} />
        <div style={layerStyle(layers[1], frontLayer === 'b')} />

        {/* Minimal overlay for text legibility */}
        <div className="absolute inset-0 bg-black/25" />
      </div>

      {/* Children content */}
      {children}
    </div>
  );
}
