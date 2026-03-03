import { useState, useEffect, useRef } from 'react';

interface DynamicBlurBackgroundProps {
  imageUrl: string;
  children: React.ReactNode;
}

export default function DynamicBlurBackground({ imageUrl, children }: DynamicBlurBackgroundProps) {
  const [layers, setLayers] = useState<[string, string]>([imageUrl, imageUrl]);
  const [frontLayer, setFrontLayer] = useState<'a' | 'b'>('a');
  const prevUrlRef = useRef(imageUrl);
  const transitionTokenRef = useRef(0);

  useEffect(() => {
    if (imageUrl === prevUrlRef.current) return;
    prevUrlRef.current = imageUrl;

    const nextFront: 'a' | 'b' = frontLayer === 'a' ? 'b' : 'a';
    const targetIndex = nextFront === 'a' ? 0 : 1;
    const token = ++transitionTokenRef.current;

    const commitSwitch = () => {
      if (token !== transitionTokenRef.current) return;

      setLayers((prev) => {
        const next: [string, string] = [prev[0], prev[1]];
        next[targetIndex] = imageUrl;
        return next;
      });

      requestAnimationFrame(() => {
        if (token === transitionTokenRef.current) {
          setFrontLayer(nextFront);
        }
      });
    };

    // Keep current image visible until the next one is decoded to avoid transparent flashes.
    if (!imageUrl) {
      commitSwitch();
      return;
    }

    const img = new Image();
    img.onload = commitSwitch;
    img.onerror = commitSwitch;
    img.src = imageUrl;
  }, [imageUrl, frontLayer]);

  const layerStyle = (url: string, isFront: boolean): React.CSSProperties => ({
    position: 'absolute',
    inset: 0,
    backgroundImage: url ? `url(${url})` : 'none',
    backgroundColor: '#0a0720',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(60px) saturate(120%)',
    transform: 'scale(1.2)',
    opacity: isFront ? 1 : 0,
    transition: 'opacity 0.6s ease-in-out',
    willChange: 'opacity',
  });

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ backgroundColor: '#0a0720' }}>
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
