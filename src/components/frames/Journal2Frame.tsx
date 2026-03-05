interface Journal2FrameProps {
  imageUrl: string;
  activity: string;
  week: number;
  day: number;
  duration: string;
  pr: string;
  imagePosition: { x: number; y: number };
  imageScale: number;
  label1?: string;
  label2?: string;
}

const Journal2Frame = ({ imageUrl, activity, week, day, duration, pr, imagePosition, imageScale, label1, label2 }: Journal2FrameProps) => {
  const metricLabel = label1 || 'Metric';
  const durationLabel = label2 || 'Duration';

  return (
    <div
      className="w-[90%] mx-auto aspect-[9/16] rounded-[4px] overflow-hidden relative"
      style={{ containerType: 'inline-size', background: '#fff' }}
    >
      {/* CSS-generated lined notebook background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(to bottom, transparent, transparent 38px, #2a9d6a 38px, #2a9d6a 39.5px)',
          backgroundPosition: '0 60px',
        }}
      />

      {/* Photo area — large, slightly rotated, moved up 10px + taller by 10px */}
      <div
        className="absolute overflow-hidden z-10"
        style={{
          top: 'calc(4cqw - 10px)',
          left: '5cqw',
          right: '5cqw',
          height: 'calc(62cqw + 10px)',
          borderRadius: '5cqw',
          transform: 'rotate(2.5deg)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
          background: '#e8e8e8',
        }}
      >
        <img
          src={imageUrl}
          alt="Activity"
          className="w-full h-full object-cover"
          style={{
            transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
          }}
        />
      </div>

      {/* Bottom content area — moved up 10px and right 10px */}
      <div
        className="absolute left-0 right-0 z-20"
        style={{ bottom: 'calc(3cqw + 10px)', padding: '0 5cqw', paddingLeft: 'calc(5cqw + 10px)' }}
      >
        {/* Badges row */}
        <div className="flex justify-between items-center" style={{ marginBottom: '2.5cqw' }}>
          <div
            className="rounded-full flex items-center justify-center"
            style={{ background: '#2DD4A8', padding: '1.8cqw 4cqw' }}
          >
            <span
              className="font-bold tracking-wide"
              style={{ fontSize: '3cqw', color: '#000', letterSpacing: '0.04em' }}
            >
              WEEK {week} | DAY {day}
            </span>
          </div>
          <div
            className="rounded-full flex items-center justify-center"
            style={{ background: '#2DD4A8', padding: '1.8cqw 4cqw' }}
          >
            <span
              className="font-bold tracking-wide"
              style={{ fontSize: '3cqw', color: '#000', letterSpacing: '0.04em' }}
            >
              Bellandur, Bangalore
            </span>
          </div>
        </div>

        {/* Activity name */}
        <h2
          className="font-black italic leading-none"
          style={{ fontSize: '10cqw', color: '#000', marginBottom: '2cqw' }}
        >
          {activity}
        </h2>

        {/* Stats row */}
        {(duration || pr) && (
          <div className="flex" style={{ gap: '8cqw' }}>
            {duration && (
              <div>
                <p style={{ fontSize: '3.2cqw', color: '#555', fontWeight: 500 }}>{durationLabel}</p>
                <p className="font-bold" style={{ fontSize: '7cqw', color: '#000' }}>{duration}</p>
              </div>
            )}
            {pr && (
              <div>
                <p style={{ fontSize: '3.2cqw', color: '#555', fontWeight: 500 }}>{metricLabel}</p>
                <p className="font-bold" style={{ fontSize: '7cqw', color: '#000' }}>{pr}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Journal2Frame;
