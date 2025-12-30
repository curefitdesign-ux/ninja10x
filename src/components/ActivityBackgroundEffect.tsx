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

  // Running - subtle horizontal motion streaks (like speed blur)
  if (effectType === 'running') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent animate-speed-line"
            style={{
              width: `${60 + Math.random() * 30}%`,
              top: `${20 + i * 12}%`,
              left: '-60%',
              animationDelay: `${i * 0.3}s`,
              animationDuration: `${1.2 + Math.random() * 0.4}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Trekking - misty fog at bottom like mountain valleys
  if (effectType === 'trekking') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Bottom mist layer */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-1/3 opacity-15"
          style={{
            background: 'linear-gradient(to top, rgba(255,255,255,0.4) 0%, transparent 100%)',
          }}
        />
        {/* Drifting mist patches */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-cloud-drift opacity-10"
            style={{
              left: `${-40 + i * 40}%`,
              bottom: `${5 + i * 8}%`,
              animationDelay: `${i * 4}s`,
              animationDuration: `${30 + i * 10}s`,
            }}
          >
            <div className="w-64 h-20 rounded-full bg-white/30 blur-2xl" />
          </div>
        ))}
      </div>
    );
  }

  // Swimming - gentle wave patterns
  if (effectType === 'swimming') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
        {/* Soft wave lines */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute w-full h-[1px] animate-wave-flow"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(147, 197, 253, 0.5) 25%, rgba(147, 197, 253, 0.8) 50%, rgba(147, 197, 253, 0.5) 75%, transparent 100%)',
              top: `${30 + i * 15}%`,
              animationDelay: `${i * 0.8}s`,
            }}
          />
        ))}
        {/* Subtle ripple circles */}
        {[...Array(2)].map((_, i) => (
          <div
            key={`ripple-${i}`}
            className="absolute rounded-full border border-blue-200/20 animate-water-ripple"
            style={{
              width: '80px',
              height: '80px',
              left: `${30 + i * 35}%`,
              top: `${40 + i * 15}%`,
              animationDelay: `${i * 1.5}s`,
            }}
          />
        ))}
      </div>
    );
  }

  // Racquet sports - arc trajectory lines (shuttlecock/ball path)
  if (effectType === 'racquet') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
        {/* Curved arc paths */}
        {[...Array(3)].map((_, i) => (
          <svg
            key={i}
            className="absolute w-full h-full animate-arc-trace"
            style={{
              animationDelay: `${i * 1.2}s`,
              animationDuration: '3s',
            }}
          >
            <path
              d={`M ${10 + i * 25}% 80% Q ${30 + i * 20}% ${20 + i * 10}%, ${70 + i * 10}% ${50 + i * 5}%`}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1"
              strokeDasharray="4 8"
              className="animate-dash-flow"
            />
          </svg>
        ))}
      </div>
    );
  }

  // Yoga - breathing circles (expand and contract like breath)
  if (effectType === 'yoga') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
        {/* Concentric breathing circles */}
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-purple-300/10 animate-breathe"
            style={{
              width: `${120 + i * 80}px`,
              height: `${120 + i * 80}px`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: '4s',
            }}
          />
        ))}
        {/* Subtle center glow */}
        <div 
          className="absolute w-24 h-24 rounded-full animate-breathe opacity-10"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.4) 0%, transparent 70%)',
          }}
        />
      </div>
    );
  }

  // Cycling - curved wind streaks (aerodynamic feel)
  if (effectType === 'cycling') {
    return (
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-15">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="absolute h-[1px] rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-wind-streak"
            style={{
              width: `${50 + Math.random() * 30}%`,
              top: `${15 + i * 15}%`,
              right: '-50%',
              animationDelay: `${i * 0.25}s`,
              animationDuration: `${1.5 + Math.random() * 0.5}s`,
              transform: `rotate(${-2 + i * 0.5}deg)`,
            }}
          />
        ))}
      </div>
    );
  }

  // Default - very subtle ambient glow
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10">
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full animate-gentle-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
        }}
      />
    </div>
  );
};

export default ActivityBackgroundEffect;
