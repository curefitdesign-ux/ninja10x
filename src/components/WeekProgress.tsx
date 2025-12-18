import PlatformIcon from './PlatformIcon';

interface WeekProgressProps {
  currentWeek: number;
  photosPerWeek: number[];
}

const WeekProgress = ({ currentWeek, photosPerWeek }: WeekProgressProps) => {
  const weeks = [
    { id: 1, label: 'Week 1', shortLabel: 'Week 1' },
    { id: 2, label: 'W2', shortLabel: 'W2' },
    { id: 3, label: 'W3', shortLabel: 'W3' },
    { id: 4, label: 'W4', shortLabel: 'W4' },
  ];

  const getIconVariant = (weekId: number, photoIndex: number): 'completed' | 'current' | 'upcoming' => {
    // Calculate overall photo index
    const overallIndex = (weekId - 1) * 3 + photoIndex;
    const totalPhotos = photosPerWeek.reduce((a, b) => a + b, 0);
    
    if (overallIndex < totalPhotos) return 'completed';
    if (overallIndex === totalPhotos) return 'current';
    return 'upcoming';
  };

  return (
    <div className="w-full">
      {/* Platform icons row */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {weeks.map((week) => (
          <div key={week.id} className="flex items-center gap-0.5">
            {[0, 1, 2].map((photoIndex) => (
              <PlatformIcon 
                key={photoIndex} 
                variant={getIconVariant(week.id, photoIndex)} 
                size={21} 
              />
            ))}
          </div>
        ))}
      </div>
      
      {/* Week labels */}
      <div className="flex items-center justify-between">
        {weeks.map((week) => (
          <span
            key={week.id}
            className={`text-xs text-center min-w-[50px] ${
              week.id === currentWeek
                ? 'text-foreground font-bold'
                : 'text-muted-foreground font-normal'
            }`}
          >
            {week.id === 1 ? week.label : week.shortLabel}
          </span>
        ))}
      </div>
    </div>
  );
};

export default WeekProgress;
