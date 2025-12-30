import { useMemo } from 'react';

interface ActivityBackgroundEffectProps {
  activity: string;
}

const ActivityBackgroundEffect = ({ activity }: ActivityBackgroundEffectProps) => {
  const activityLower = activity?.toLowerCase() || '';
  
  // Determine which effect to show based on activity
  const effectType = useMemo(() => {
    if (activityLower.includes('run') || activityLower.includes('sprint') || activityLower.includes('jog')) {
      return 'running';
    }
    if (activityLower.includes('trek') || activityLower.includes('hik') || activityLower.includes('climb') || activityLower.includes('mountain')) {
      return 'trekking';
    }
    if (activityLower.includes('swim') || activityLower.includes('pool') || activityLower.includes('water')) {
      return 'swimming';
    }
    if (activityLower.includes('tennis') || activityLower.includes('badminton') || activityLower.includes('squash') || 
        activityLower.includes('racquet') || activityLower.includes('racket') || activityLower.includes('ping') || 
        activityLower.includes('table') || activityLower.includes('paddle')) {
      return 'racquet';
    }
    if (activityLower.includes('yoga') || activityLower.includes('meditat') || activityLower.includes('stretch')) {
      return 'yoga';
    }
    if (activityLower.includes('cycle') || activityLower.includes('bike') || activityLower.includes('cycling')) {
      return 'cycling';
    }
    return 'default';
  }, [activityLower]);

  // Running - fast moving horizontal lines
  if (effectType === 'running') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-60">
        {[...Array(16)].map((_, i) => (
          <div
            key={i}
            className="absolute h-[2px] bg-gradient-to-r from-transparent via-white to-transparent animate-speed-line"
            style={{
              width: `${Math.random() * 50 + 30}%`,
              top: `${5 + i * 6}%`,
              left: '-50%',
              animationDelay: `${i * 0.1}s`,
              animationDuration: `${0.6 + Math.random() * 0.3}s`,
              opacity: 0.5 + Math.random() * 0.5,
            }}
          />
        ))}
      </div>
    );
  }

  // Trekking - subtle floating clouds
  if (effectType === 'trekking') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-cloud-drift"
            style={{
              left: `${-30 + i * 20}%`,
              top: `${10 + (i % 4) * 20}%`,
              animationDelay: `${i * 1.5}s`,
              animationDuration: `${15 + i * 3}s`,
            }}
          >
            <div 
              className="w-48 h-16 rounded-full bg-white/50 blur-xl"
              style={{ transform: `scale(${1 + Math.random() * 0.5})` }}
            />
            <div 
              className="absolute -top-6 left-8 w-28 h-14 rounded-full bg-white/40 blur-lg"
            />
            <div 
              className="absolute -top-3 left-20 w-24 h-12 rounded-full bg-white/35 blur-lg"
            />
          </div>
        ))}
      </div>
    );
  }

  // Swimming - water splash/ripple effect
  if (effectType === 'swimming') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        {/* Water ripples */}
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border-2 border-cyan-300/50 animate-water-ripple"
            style={{
              width: '120px',
              height: '120px',
              left: `${15 + i * 12}%`,
              top: `${25 + (i % 3) * 25}%`,
              animationDelay: `${i * 0.6}s`,
            }}
          />
        ))}
        {/* Water droplets */}
        {[...Array(15)].map((_, i) => (
          <div
            key={`drop-${i}`}
            className="absolute rounded-full bg-cyan-200/60 animate-water-drop"
            style={{
              width: `${6 + Math.random() * 8}px`,
              height: `${6 + Math.random() * 8}px`,
              left: `${5 + Math.random() * 90}%`,
              top: '-10%',
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${1.5 + Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Racquet sports - bouncing balls
  if (effectType === 'racquet') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-ball-bounce"
            style={{
              left: `${10 + i * 15}%`,
              bottom: '10%',
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${1.2 + i * 0.15}s`,
            }}
          >
            <div 
              className="w-6 h-6 rounded-full bg-gradient-to-br from-yellow-300/80 to-yellow-500/60 shadow-lg"
              style={{
                boxShadow: '0 0 20px rgba(255, 220, 0, 0.5)',
              }}
            />
          </div>
        ))}
        {/* Motion trails */}
        {[...Array(5)].map((_, i) => (
          <div
            key={`trail-${i}`}
            className="absolute w-2 h-28 bg-gradient-to-b from-yellow-300/40 to-transparent animate-trail-fade"
            style={{
              left: `${15 + i * 18}%`,
              top: `${25 + i * 8}%`,
              transform: 'rotate(-25deg)',
              animationDelay: `${i * 0.5}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Yoga - gentle floating particles/energy
  if (effectType === 'yoga') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-45">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-zen-float"
            style={{
              width: `${10 + Math.random() * 14}px`,
              height: `${10 + Math.random() * 14}px`,
              background: `radial-gradient(circle, rgba(168, 85, 247, 0.6) 0%, transparent 70%)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Cycling - wind/motion lines
  if (effectType === 'cycling') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-55">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute h-[3px] rounded-full bg-gradient-to-r from-transparent via-white/70 to-transparent animate-wind-streak"
            style={{
              width: `${40 + Math.random() * 50}%`,
              top: `${10 + i * 7}%`,
              right: '-50%',
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${0.8 + Math.random() * 0.4}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Default - subtle shimmer
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-35">
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/30 animate-gentle-pulse"
          style={{
            width: `${30 + Math.random() * 50}px`,
            height: `${30 + Math.random() * 50}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.6}s`,
            animationDuration: `${2.5 + Math.random() * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
};

export default ActivityBackgroundEffect;
