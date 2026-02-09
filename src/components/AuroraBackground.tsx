const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Base background — deep blue-violet */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Large violet glow — top center */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full animate-aurora-float"
        style={{
          background: 'radial-gradient(circle, hsla(265, 80%, 55%, 0.25) 0%, transparent 70%)',
          top: '-5%',
          left: '10%',
          animationDelay: '0s',
        }}
      />
      
      {/* Blue glow — mid left */}
      <div 
        className="absolute w-[480px] h-[480px] rounded-full animate-aurora-pulse"
        style={{
          background: 'radial-gradient(circle, hsla(225, 90%, 55%, 0.22) 0%, transparent 70%)',
          top: '20%',
          left: '-15%',
          animationDelay: '2s',
        }}
      />
      
      {/* Purple glow — right */}
      <div 
        className="absolute w-[460px] h-[460px] rounded-full animate-aurora-float"
        style={{
          background: 'radial-gradient(circle, hsla(252, 85%, 60%, 0.20) 0%, transparent 70%)',
          top: '35%',
          right: '-10%',
          animationDelay: '1s',
        }}
      />
      
      {/* Deep indigo — bottom left */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full animate-aurora-pulse"
        style={{
          background: 'radial-gradient(circle, hsla(240, 70%, 50%, 0.18) 0%, transparent 70%)',
          top: '55%',
          left: '5%',
          animationDelay: '3s',
        }}
      />
      
      {/* Violet-pink accent — top right */}
      <div 
        className="absolute w-[420px] h-[420px] rounded-full animate-aurora-float"
        style={{
          background: 'radial-gradient(circle, hsla(280, 75%, 58%, 0.18) 0%, transparent 70%)',
          top: '5%',
          right: '-5%',
          animationDelay: '4s',
        }}
      />
      
      {/* Blue accent — bottom */}
      <div 
        className="absolute w-[520px] h-[520px] rounded-full animate-aurora-pulse"
        style={{
          background: 'radial-gradient(circle, hsla(220, 85%, 55%, 0.16) 0%, transparent 70%)',
          top: '70%',
          left: '20%',
          animationDelay: '2.5s',
        }}
      />
      
      {/* Subtle warm violet — center */}
      <div 
        className="absolute w-[550px] h-[550px] rounded-full animate-aurora-float"
        style={{
          background: 'radial-gradient(circle, hsla(260, 70%, 50%, 0.12) 0%, transparent 70%)',
          top: '30%',
          left: '15%',
          animationDelay: '1.5s',
        }}
      />
    </div>
  );
};

export default AuroraBackground;
