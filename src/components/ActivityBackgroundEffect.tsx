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
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-white to-transparent animate-speed-line"
            style={{
              width: `${Math.random() * 40 + 20}%`,
              top: `${10 + i * 7}%`,
              left: '-50%',
              animationDelay: `${i * 0.15}s`,
              animationDuration: `${0.8 + Math.random() * 0.4}s`,
              opacity: 0.3 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>
    );
  }

  // Trekking - subtle floating clouds
  if (effectType === 'trekking') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-cloud-drift"
            style={{
              left: `${-20 + i * 25}%`,
              top: `${15 + (i % 3) * 25}%`,
              animationDelay: `${i * 2}s`,
              animationDuration: `${20 + i * 5}s`,
            }}
          >
            <div 
              className="w-32 h-12 rounded-full bg-white/40 blur-xl"
              style={{ transform: `scale(${0.8 + Math.random() * 0.6})` }}
            />
            <div 
              className="absolute -top-4 left-6 w-20 h-10 rounded-full bg-white/30 blur-lg"
            />
            <div 
              className="absolute -top-2 left-16 w-16 h-8 rounded-full bg-white/25 blur-lg"
            />
          </div>
        ))}
      </div>
    );
  }

  // Swimming - water splash/ripple effect
  if (effectType === 'swimming') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        {/* Water ripples */}
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-cyan-300/30 animate-water-ripple"
            style={{
              width: '100px',
              height: '100px',
              left: `${20 + i * 15}%`,
              top: `${30 + (i % 2) * 30}%`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
        {/* Water droplets */}
        {[...Array(10)].map((_, i) => (
          <div
            key={`drop-${i}`}
            className="absolute rounded-full bg-cyan-200/40 animate-water-drop"
            style={{
              width: `${4 + Math.random() * 6}px`,
              height: `${4 + Math.random() * 6}px`,
              left: `${10 + Math.random() * 80}%`,
              top: '-10%',
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${2 + Math.random()}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Racquet sports - bouncing balls
  if (effectType === 'racquet') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-ball-bounce"
            style={{
              left: `${15 + i * 20}%`,
              bottom: '10%',
              animationDelay: `${i * 0.6}s`,
              animationDuration: `${1.5 + i * 0.2}s`,
            }}
          >
            <div 
              className="w-4 h-4 rounded-full bg-gradient-to-br from-yellow-300/60 to-yellow-500/40 shadow-lg"
              style={{
                boxShadow: '0 0 10px rgba(255, 220, 0, 0.3)',
              }}
            />
          </div>
        ))}
        {/* Motion trails */}
        {[...Array(3)].map((_, i) => (
          <div
            key={`trail-${i}`}
            className="absolute w-1 h-20 bg-gradient-to-b from-yellow-300/20 to-transparent animate-trail-fade"
            style={{
              left: `${25 + i * 25}%`,
              top: `${30 + i * 10}%`,
              transform: 'rotate(-30deg)',
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Yoga - gentle floating particles/energy
  if (effectType === 'yoga') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(15)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-zen-float"
            style={{
              width: `${6 + Math.random() * 8}px`,
              height: `${6 + Math.random() * 8}px`,
              background: `radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Cycling - wind/motion lines
  if (effectType === 'cycling') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-25">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute h-[2px] rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-wind-streak"
            style={{
              width: `${30 + Math.random() * 40}%`,
              top: `${15 + i * 10}%`,
              right: '-50%',
              animationDelay: `${i * 0.2}s`,
              animationDuration: `${1 + Math.random() * 0.5}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Default - subtle shimmer
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/20 animate-gentle-pulse"
          style={{
            width: `${20 + Math.random() * 40}px`,
            height: `${20 + Math.random() * 40}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${i * 0.8}s`,
            animationDuration: `${3 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
};

export default ActivityBackgroundEffect;
