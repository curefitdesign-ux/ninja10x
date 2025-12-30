import { User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import shuttlecockIcon from '@/assets/frames/shuttlecock.png';
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';
import FitnessFrame from '@/components/frames/FitnessFrame';
import TicketFrame from '@/components/frames/TicketFrame';

interface Photo {
  id: string;
  url: string;
  originalUrl?: string;
  isVideo?: boolean;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';
  duration?: string;
  pr?: string;
  uploadDate: string;
}

type FrameType = 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';

// Helper to detect if URL is a video
const isVideoUrl = (url: string) => {
  return url.startsWith('data:video') || /\.(mp4|webm|mov|avi)$/i.test(url);
};

// Render photo/video in its selected frame template
const renderInFrame = (photo: Photo) => {
  const frame: FrameType = photo.frame || 'shaky';
  const frameProps = {
    imageUrl: photo.originalUrl || photo.url,
    isVideo: photo.isVideo || isVideoUrl(photo.url),
    activity: photo.activity || 'Activity',
    week: 1,
    day: 1,
    duration: photo.duration || '2hrs',
    pr: photo.pr || '',
    imagePosition: { x: 0, y: 0 },
    imageScale: 1.2,
  };

  switch (frame) {
    case 'journal':
      return <JournalFrame {...frameProps} />;
    case 'vogue':
      return <VogueFrame {...frameProps} />;
    case 'fitness':
      return <FitnessFrame {...frameProps} />;
    case 'ticket':
      return <TicketFrame {...frameProps} />;
    case 'shaky':
    default:
      return <ShakyFrame {...frameProps} />;
  }
};

interface WidgetLayout2Props {
  photos: Photo[];
  onCardClick: () => void;
  hasUploadedToday: boolean;
  hoursUntilNextUpload: number;
  currentDate: string;
}

const WidgetLayout2 = ({ 
  photos, 
  onCardClick, 
  currentDate
}: WidgetLayout2Props) => {
  const navigate = useNavigate();
  const todaysPhoto = photos.find(p => p.uploadDate === currentDate);

  const handlePhotoTap = (photo: Photo) => {
    const mediaUrl = photo.originalUrl || photo.url;

    navigate('/preview', { 
      state: { 
        imageUrl: mediaUrl,
        originalUrl: mediaUrl,
        isVideo: photo.isVideo,
        activity: photo.activity,
        frame: photo.frame,
        duration: photo.duration,
        pr: photo.pr,
        isReview: true
      } 
    });
  };

  const displayPhoto = todaysPhoto || (photos.length > 0 ? photos[photos.length - 1] : null);

  return (
    <div className="px-4">
      <div 
        className="relative overflow-visible w-full rounded-3xl"
        style={{ 
          background: 'linear-gradient(180deg, #4a4578 0%, #352f5e 30%, #1f1a40 70%, #0d0a1a 100%)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        {/* Grid Background */}
        <div 
          className="absolute inset-0 rounded-3xl overflow-hidden"
        >
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)
              `,
              backgroundSize: '26px 26px'
            }}
          />
        </div>

        {/* Sparkle dots */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-3xl">
          {[...Array(25)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-white rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${10 + Math.random() * 80}%`,
                opacity: 0.2 + Math.random() * 0.4
              }}
            />
          ))}
        </div>

        {/* CULT NINJA Badge - positioned at top, partially outside */}
        <div className="flex justify-center relative z-20" style={{ marginTop: '-12px' }}>
          <div 
            className="px-5 py-2.5 rounded-2xl"
            style={{ 
              background: 'linear-gradient(180deg, #5a5a5a 0%, #3d3d3d 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 15px rgba(0,0,0,0.5)'
            }}
          >
            <span 
              className="font-bold text-sm tracking-[0.15em]"
              style={{ 
                color: '#c9a87c',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              CULT NINJA
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="pt-5 pb-3 relative z-10">
          <h2 
            className="text-xl font-bold text-white text-center tracking-wide"
            style={{ 
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontStyle: 'italic'
            }}
          >
            CONQUER WILL POWER
          </h2>
        </div>

        {/* Main Card Section */}
        <div className="relative z-10 flex justify-center items-center pb-4" style={{ minHeight: '280px' }}>
          {displayPhoto ? (
            /* Photo Card with details */
            <div 
              className="relative cursor-pointer"
              onClick={() => handlePhotoTap(displayPhoto)}
              style={{ transform: 'rotate(4deg)' }}
            >
              {/* Back shadow card */}
              <div 
                className="absolute w-full h-full rounded-2xl"
                style={{ 
                  background: 'rgba(255,255,255,0.12)',
                  transform: 'rotate(-10deg) translateX(-12px)',
                  top: '-3px'
                }}
              />
              
              {/* Main Card */}
              <div 
                className="relative bg-white rounded-2xl overflow-hidden shadow-2xl"
                style={{ width: '175px' }}
              >
                {/* Template Preview - render in selected frame */}
                <div className="relative w-full" style={{ aspectRatio: '9/16' }}>
                  <div className="absolute inset-0 flex items-center justify-center bg-black">
                    {renderInFrame(displayPhoto)}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Empty State Card */
            <div 
              className="relative cursor-pointer"
              onClick={onCardClick}
            >
              <div 
                className="flex flex-col items-center justify-center rounded-2xl"
                style={{ 
                  width: '160px',
                  height: '210px',
                  background: 'linear-gradient(180deg, #5a5872 0%, #4a4860 100%)',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.3)'
                }}
              >
                {/* Camera frame with user icon */}
                <div className="relative w-12 h-12">
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/40 rounded-tl" />
                  <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white/40 rounded-tr" />
                  <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white/40 rounded-bl" />
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/40 rounded-br" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <User className="w-7 h-7 text-white/40" strokeWidth={1.5} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Film Strip Section */}
        <div className="relative z-10 pb-4 pl-2 pr-3">
          <div className="flex items-center">
            {/* Film Roll */}
            <div className="relative flex-shrink-0 z-10">
              {/* Outer ring with 3D effect */}
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #8a8a8a 0%, #5a5a5a 30%, #3a3a3a 70%, #4a4a4a 100%)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
                }}
              >
                {/* Inner dark circle */}
                <div 
                  className="w-3.5 h-3.5 rounded-full"
                  style={{ 
                    background: '#0a0a0a',
                    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.8)'
                  }}
                />
              </div>
              
              {/* Dashed line from roll to strip */}
              <div 
                className="absolute top-1/2 left-full"
                style={{
                  width: '8px',
                  borderTop: '1px dashed rgba(255,255,255,0.25)',
                  transform: 'translateY(-50%)'
                }}
              />
            </div>

            {/* Film Strip */}
            <div 
              className="flex-1 rounded-md overflow-hidden ml-2"
              style={{
                background: '#555555',
                boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
              }}
            >
              {/* Top sprocket holes */}
              <div 
                className="flex justify-between px-2 py-0.5"
                style={{ borderBottom: '1px solid #3a3a3a' }}
              >
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1.5 h-1 rounded-sm"
                    style={{ background: '#1a1a1a' }}
                  />
                ))}
              </div>

              {/* Film frames - 4 groups of 3 */}
              <div className="flex px-1.5 py-1 gap-1">
                {[0, 1, 2, 3].map((week) => (
                  <div key={week} className="flex gap-0.5 flex-1">
                    {[0, 1, 2].map((day) => {
                      const photoIndex = week * 3 + day;
                      const photo = photos[photoIndex];
                      return (
                        <div 
                          key={day}
                          className="flex-1 aspect-[3/4] overflow-hidden"
                          style={{ background: '#0a0a0a', borderRadius: '2px' }}
                        >
                          {photo && (
                            photo.isVideo || isVideoUrl(photo.url) ? (
                              <video
                                src={photo.url}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                              />
                            ) : (
                              <img
                                src={photo.url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Bottom sprocket holes */}
              <div 
                className="flex justify-between px-2 py-0.5"
                style={{ borderTop: '1px solid #3a3a3a' }}
              >
                {[...Array(12)].map((_, i) => (
                  <div 
                    key={i} 
                    className="w-1.5 h-1 rounded-sm"
                    style={{ background: '#1a1a1a' }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WidgetLayout2;
