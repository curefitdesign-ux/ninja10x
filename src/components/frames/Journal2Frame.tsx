import paperclipImg from '@/assets/frames/paperclip-silver.png';
import shuttlecockImg from '@/assets/frames/shuttlecock.png';
import linedBg from '@/assets/frames/journal2-lined-bg.png';

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
      className="w-[90%] mx-auto aspect-[9/16] rounded-[24px] overflow-hidden relative"
      style={{ containerType: 'inline-size', background: '#f5f5f0' }}
    >
      {/* Lined notebook background */}
      <img
        src={linedBg}
        alt=""
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        style={{ opacity: 0.9 }}
      />

      {/* Paperclip — top center-right */}
      <div
        className="absolute z-30"
        style={{
          top: '-3cqw',
          right: '28cqw',
          width: '14cqw',
          height: '28cqw',
        }}
      >
        <img
          src={paperclipImg}
          alt="Paperclip"
          className="w-full h-full object-contain"
          style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' }}
        />
      </div>

      {/* Photo area — large, slightly rotated */}
      <div
        className="absolute overflow-hidden z-10"
        style={{
          top: '4cqw',
          left: '5cqw',
          right: '5cqw',
          height: '62cqw',
          borderRadius: '5cqw',
          transform: 'rotate(2.5deg)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1)',
          background: '#e8e8e8',
        }}
      >
        {/* Aspect-filling photo */}
        <img
          src={imageUrl}
          alt="Activity"
          className="w-full h-full object-cover"
          style={{
            transform: `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`,
          }}
        />

        {/* Shuttlecock sticker — bottom-left of photo */}
        <div
          className="absolute z-20"
          style={{
            bottom: '3cqw',
            left: '3cqw',
            width: '16cqw',
            height: '16cqw',
            transform: 'rotate(-15deg)',
            filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.2))',
          }}
        >
          <img
            src={shuttlecockImg}
            alt="Shuttlecock"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      {/* Bottom content area */}
      <div
        className="absolute left-0 right-0 z-20"
        style={{ bottom: '3cqw', padding: '0 5cqw' }}
      >
        {/* Badges row */}
        <div className="flex justify-between items-center" style={{ marginBottom: '2.5cqw' }}>
          <div
            className="rounded-full flex items-center justify-center"
            style={{
              background: '#2DD4A8',
              padding: '1.8cqw 4cqw',
            }}
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
            style={{
              background: '#2DD4A8',
              padding: '1.8cqw 4cqw',
            }}
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
          style={{
            fontSize: '10cqw',
            color: '#000',
            marginBottom: '2cqw',
          }}
        >
          {activity}
        </h2>

        {/* Stats row — 3 columns like reference */}
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
