interface DynamicBlurBackgroundProps {
  imageUrl: string;
  children: React.ReactNode;
}

export default function DynamicBlurBackground({ imageUrl, children }: DynamicBlurBackgroundProps) {
  return (
    <div className="fixed inset-0 overflow-hidden" style={{ height: '100dvh' }}>
      {/* Static blurred background - no animations */}
      <div className="absolute inset-0">
        {/* Background image with heavy blur */}
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(60px) saturate(120%)',
            transform: 'scale(1.2)',
          }}
        />
        
        {/* Dark overlay for contrast */}
        <div 
          className="absolute inset-0 bg-black/60"
        />
      </div>

      {/* Children content */}
      {children}
    </div>
  );
}
