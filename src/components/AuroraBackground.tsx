const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base background */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Aurora orbs */}
      <div 
        className="absolute w-[440px] h-[440px] rounded-full animate-aurora-float"
        style={{
          background: 'radial-gradient(circle, hsla(195, 100%, 50%, 0.2) 0%, transparent 70%)',
          top: '15%',
          left: '20%',
          animationDelay: '0s',
        }}
      />
      
      <div 
        className="absolute w-[440px] h-[440px] rounded-full animate-aurora-pulse"
        style={{
          background: 'radial-gradient(circle, hsla(48, 100%, 55%, 0.2) 0%, transparent 70%)',
          top: '-5%',
          left: '-10%',
          animationDelay: '2s',
        }}
      />
      
      <div 
        className="absolute w-[440px] h-[440px] rounded-full animate-aurora-float"
        style={{
          background: 'radial-gradient(circle, hsla(195, 100%, 50%, 0.15) 0%, transparent 70%)',
          top: '40%',
          right: '-20%',
          animationDelay: '1s',
        }}
      />
      
      <div 
        className="absolute w-[440px] h-[440px] rounded-full animate-aurora-pulse"
        style={{
          background: 'radial-gradient(circle, hsla(48, 100%, 55%, 0.2) 0%, transparent 70%)',
          top: '55%',
          right: '-10%',
          animationDelay: '3s',
        }}
      />
      
      <div 
        className="absolute w-[440px] h-[440px] rounded-full animate-aurora-float"
        style={{
          background: 'radial-gradient(circle, hsla(340, 100%, 60%, 0.2) 0%, transparent 70%)',
          top: '-10%',
          right: '-5%',
          animationDelay: '4s',
        }}
      />
      
      <div 
        className="absolute w-[440px] h-[440px] rounded-full animate-aurora-pulse"
        style={{
          background: 'radial-gradient(circle, hsla(195, 100%, 50%, 0.2) 0%, transparent 70%)',
          top: '70%',
          left: '10%',
          animationDelay: '2.5s',
        }}
      />
      
      <div 
        className="absolute w-[520px] h-[520px] rounded-full animate-aurora-float"
        style={{
          background: 'radial-gradient(circle, hsla(48, 100%, 55%, 0.15) 0%, transparent 70%)',
          top: '25%',
          left: '5%',
          animationDelay: '1.5s',
        }}
      />
      
      <div 
        className="absolute w-[440px] h-[440px] rounded-full animate-aurora-pulse"
        style={{
          background: 'radial-gradient(circle, hsla(195, 100%, 50%, 0.2) 0%, transparent 70%)',
          top: '50%',
          left: '15%',
          animationDelay: '3.5s',
        }}
      />
    </div>
  );
};

export default AuroraBackground;
