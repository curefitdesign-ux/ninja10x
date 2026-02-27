import { useState, useEffect, useRef } from 'react';

interface DynamicBlurBackgroundProps {
  imageUrl: string;
  children: React.ReactNode;
}

export default function DynamicBlurBackground({ imageUrl, children }: DynamicBlurBackgroundProps) {
  const [layers, setLayers] = useState<[string, string]>([imageUrl, '']);
  const [frontLayer, setFrontLayer] = useState<'a' | 'b'>('a');
  const prevUrlRef = useRef(imageUrl);

  useEffect(() => {
    if (imageUrl === prevUrlRef.current) return;
    prevUrlRef.current = imageUrl;

    if (frontLayer === 'a') {
      setLayers(prev => [prev[0], imageUrl]);
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
    backgroundColor: url ? undefined : '#0a0720',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(60px) saturate(120%)',
    transform: 'scale(1.2)',
    opacity: isFront ? 1 : 0,
    transition: 'opacity 0.6s ease-in-out',
    willChange: 'opacity',
  });

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Crossfading blurred backgrounds — oversized to cover Safari overscroll */}
      <div className="absolute overflow-hidden" style={{ top: -50, bottom: -50, left: -50, right: -50 }}>
        <div style={layerStyle(layers[0], frontLayer === 'a')} />
        <div style={layerStyle(layers[1], frontLayer === 'b')} />
        <div className="absolute inset-0 bg-black/25" />
      </div>

      {/* Children content */}
      {children}
    </div>
  );
}
