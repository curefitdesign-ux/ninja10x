import { useRef, useEffect } from 'react';
// @ts-ignore
import '@fontsource/caveat/700.css';

interface BoldFrameProps {
  imageUrl: string;
  isVideo?: boolean;
  activity: string;
  week: number;
  day: number;
  duration: string;
  pr: string;
  imagePosition: { x: number; y: number };
  imageScale: number;
  label1?: string;
  label2?: string;
  label1Name?: string;
  label2Name?: string;
}

const BoldFrame = ({
  imageUrl,
  isVideo,
  activity,
  week,
  day,
  duration,
  pr,
  imagePosition,
  imageScale,
  label1,
  label2,
  label1Name,
  label2Name,
}: BoldFrameProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isVideo && videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
    }
  }, [isVideo, imageUrl]);

  const durationUnit = label2 || 'min';
  const prUnit = label1 || '';
  const durationValue = duration ? duration.replace(/[^0-9:]/g, '') : '';
  const isNumericPr = pr ? /\d/.test(pr) : false;
  const prValue = pr ? (isNumericPr ? pr.replace(/[^0-9.]/g, '') : pr) : '';
  const hasMetrics = !!(durationValue || prValue);

  const durationMetricName = (label2Name || 'Duration').toUpperCase();
  const prMetricName = (label1Name || 'Distance').toUpperCase();

  const mediaTransform =
    imagePosition.x || imagePosition.y || imageScale !== 1
      ? `translate(${imagePosition.x}%, ${imagePosition.y}%) scale(${imageScale})`
      : `scale(${imageScale})`;

  return (
    <div
      className="w-full h-full relative overflow-hidden flex flex-col"
      style={{
        background: '#f0ede6',
        borderRadius: '1.4cqw',
        containerType: 'inline-size',
      }}
    >
      {/* Header */}
      <div style={{ padding: '5.2cqw 5.5cqw 0 5.5cqw' }}>
        <div
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontSize: '11.3cqw',
            color: '#1a1a1a',
            lineHeight: 0.92,
            letterSpacing: '-0.06em',
            textTransform: 'uppercase',
          }}
        >
          I DID
        </div>
        <div
          style={{
            fontFamily: "'Caveat', cursive",
            fontWeight: 700,
            fontSize: '14.6cqw',
            color: '#6B4EE6',
            lineHeight: 0.82,
            marginTop: '-1.2cqw',
            marginLeft: '-0.5%',
            transform: 'rotate(-1deg)',
          }}
        >
          {activity || 'Activity'}
        </div>
        <div
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 700,
            fontSize: '11.3cqw',
            color: '#1a1a1a',
            lineHeight: 0.92,
            letterSpacing: '-0.06em',
            textTransform: 'uppercase',
            marginTop: '-0.8cqw',
          }}
        >
          TODAY!
        </div>
      </div>

      {/* Meta Row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '2cqw',
          padding: '2.8cqw 5.5cqw 1.2cqw 5.5cqw',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 500,
            fontSize: '3.15cqw',
            color: '#3a3a3a',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          CULT NINJA JOURNEY
        </span>
        <span
          style={{
            fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
            fontWeight: 500,
            fontSize: '3.15cqw',
            color: '#3a3a3a',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}
        >
          WEEK {week} / DAY {day}
        </span>
      </div>

      {/* Dashed line above photo */}
      <div style={{ padding: '0 5cqw' }}>
        <div
          style={{
            width: '100%',
            borderTop: '0.35cqw dashed #b8b4a8',
          }}
        />
      </div>

      {/* Photo / Video */}
      <div
        style={{
          margin: '1.8cqw 4.8% 0 4.8%',
          borderRadius: '1cqw',
          overflow: 'hidden',
          flex: 1,
          position: 'relative',
          background: '#000',
          minHeight: 0,
          marginBottom: hasMetrics ? '0' : '3.5cqw',
        }}
      >
        {isVideo ? (
          <video
            ref={videoRef}
            src={imageUrl}
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            style={{ transform: mediaTransform }}
          />
        ) : (
          <img
            src={imageUrl}
            alt="Activity"
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            style={{ transform: mediaTransform }}
          />
        )}
      </div>

      {/* Bottom metrics */}
      {hasMetrics && (
        <div style={{ padding: '0 5cqw 2.6cqw 5cqw', flexShrink: 0, overflow: 'hidden' }}>
          <div
            style={{
              width: '100%',
              borderTop: '0.35cqw dashed #b8b4a8',
              marginTop: '1.6cqw',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: '2.2cqw',
              minHeight: '8.8cqw',
              padding: '1.5cqw 0.4cqw 0 0.4cqw',
            }}
          >
            <div
              style={{
                width: '48%',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.6cqw',
                visibility: durationValue ? 'visible' : 'hidden',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontWeight: 500,
                  fontSize: '3.2cqw',
                  color: '#3a3a3a',
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {durationMetricName} :
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: '0.4cqw',
                  whiteSpace: 'nowrap',
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontWeight: 700,
                    fontSize: '6.2cqw',
                    color: '#6B4EE6',
                    fontStyle: 'italic',
                    lineHeight: 1,
                  }}
                >
                  {durationValue || '—'}
                </span>
                {durationUnit && (
                  <span
                    style={{
                      fontFamily: "'Caveat', cursive",
                      fontWeight: 700,
                      fontSize: '5cqw',
                      color: '#6B4EE6',
                      fontStyle: 'italic',
                      lineHeight: 1,
                    }}
                  >
                    {durationUnit}
                  </span>
                )}
              </span>
            </div>

            <div
              style={{
                width: '48%',
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'flex-end',
                gap: '0.6cqw',
                visibility: prValue ? 'visible' : 'hidden',
                overflow: 'hidden',
              }}
            >
              <span
                style={{
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  fontWeight: 500,
                  fontSize: '3.2cqw',
                  color: '#3a3a3a',
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {prMetricName} :
              </span>
              <span
                style={{
                  fontFamily: "'Caveat', cursive",
                  fontWeight: 700,
                  fontSize: isNumericPr ? '6.2cqw' : '4.8cqw',
                  color: '#6B4EE6',
                  fontStyle: 'italic',
                  lineHeight: 1,
                  whiteSpace: 'nowrap',
                }}
              >
                {prValue || '—'}
              </span>
              {prUnit && (
                <span
                  style={{
                    fontFamily: "'Caveat', cursive",
                    fontWeight: 700,
                    fontSize: '4.8cqw',
                    color: '#6B4EE6',
                    fontStyle: 'italic',
                    lineHeight: 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {prUnit}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoldFrame;
