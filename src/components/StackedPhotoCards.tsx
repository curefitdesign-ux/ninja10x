import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, addDays, startOfDay } from 'date-fns';

// Activity icons
import cyclingIcon from '@/assets/activities/cycling.png';
import runningIcon from '@/assets/activities/running.png';
import yogaIcon from '@/assets/activities/yoga.png';
import footballIcon from '@/assets/activities/football.png';
import cricketIcon from '@/assets/activities/cricket.png';
import trekkingIcon from '@/assets/activities/trekking.png';
import boxingIcon from '@/assets/activities/boxing.png';
import basketballIcon from '@/assets/activities/basketball.png';
import racquetIcon from '@/assets/activities/racquet.png';

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

// Helper to detect if URL is a video
const isVideoUrl = (url: string) => {
  return url.startsWith('data:video') || /\.(mp4|webm|mov|avi)$/i.test(url);
};

// Map activity names to icons
const activityIcons: { [key: string]: string } = {
  'Cycling': cyclingIcon,
  'Running': runningIcon,
  'Yoga': yogaIcon,
  'Football': footballIcon,
  'Cricket': cricketIcon,
  'Trekking': trekkingIcon,
  'Boxing': boxingIcon,
  'Basketball': basketballIcon,
  'Racquet': racquetIcon,
};

interface StackedPhotoCardsProps {
  photos: Photo[];
  onCardClick: () => void;
  currentDate: string;
}

interface DayCard {
  date: Date;
  dateString: string;
  displayDate: string;
  photo?: Photo;
  state: 'past' | 'active' | 'upcoming';
  isLocked: boolean;
}

const StackedPhotoCards = ({ photos, onCardClick, currentDate }: StackedPhotoCardsProps) => {
  const navigate = useNavigate();
  
  // Get today's photo if exists
  const todaysPhoto = photos.find(p => p.uploadDate === currentDate);
  
  // Generate 3 days: yesterday, today, tomorrow
  const today = startOfDay(new Date());
  const days: DayCard[] = [
    {
      date: subDays(today, 1),
      dateString: format(subDays(today, 1), 'yyyy-MM-dd'),
      displayDate: format(subDays(today, 1), 'd MMM').toUpperCase(),
      photo: photos.find(p => p.uploadDate === format(subDays(today, 1), 'yyyy-MM-dd')),
      state: 'past',
      isLocked: false,
    },
    {
      date: today,
      dateString: format(today, 'yyyy-MM-dd'),
      displayDate: format(today, 'd MMM').toUpperCase(),
      photo: todaysPhoto,
      state: 'active',
      isLocked: false,
    },
    {
      date: addDays(today, 1),
      dateString: format(addDays(today, 1), 'yyyy-MM-dd'),
      displayDate: format(addDays(today, 1), 'd MMM').toUpperCase(),
      photo: undefined,
      state: 'upcoming',
      isLocked: !todaysPhoto,
    },
  ];

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
        isReview: false,
      },
    });
  };

  // Card component for each day
  const DayCardComponent = ({ day, position }: { day: DayCard; position: number }) => {
    const isCenter = position === 1;
    const isLeft = position === 0;
    
    // Calculate transforms based on position
    const getTransform = () => {
      if (isCenter) {
        return { translateX: 0, scale: 1, rotate: 0, zIndex: 30 };
      } else if (isLeft) {
        return { translateX: -75, scale: 0.85, rotate: -8, zIndex: 20 };
      } else {
        return { translateX: 75, scale: 0.85, rotate: 8, zIndex: 20 };
      }
    };
    
    const { translateX, scale, rotate, zIndex } = getTransform();
    
    // Card base styles
    const cardWidth = isCenter ? 150 : 130;
    const cardHeight = isCenter ? 190 : 165;

    // Get activity icon for this photo
    const activityIcon = day.photo?.activity ? activityIcons[day.photo.activity] : null;

    // Render locked upcoming card
    if (day.isLocked) {
      return (
        <div
          className="absolute top-1/2 left-1/2 transition-all duration-500 ease-out"
          style={{
            transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
            zIndex,
          }}
        >
          {/* Activity icon placeholder */}
          <div 
            className="absolute -top-3 -right-3 w-8 h-8 rounded-lg flex items-center justify-center z-10"
            style={{
              background: 'rgba(60, 60, 80, 0.9)',
              border: '2px solid rgba(0,0,0,0.8)',
            }}
          >
            <Lock className="w-4 h-4 text-white/40" />
          </div>
          
          {/* Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              background: 'rgba(70, 70, 90, 0.8)',
              border: '3px solid rgba(0,0,0,0.8)',
            }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center">
              <Lock className="w-8 h-8 text-white/30 mb-2" />
            </div>
          </div>
          
          {/* Date label */}
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
            <p 
              className="text-xs font-bold tracking-wide"
              style={{
                color: 'rgba(255,255,255,0.4)',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
              }}
            >
              {day.displayDate}
            </p>
          </div>
        </div>
      );
    }

    // Render active card without photo (today's upload)
    if (day.state === 'active' && !day.photo) {
      return (
        <div
          className="absolute top-1/2 left-1/2 transition-all duration-500 ease-out cursor-pointer"
          style={{
            transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
            zIndex,
          }}
          onClick={onCardClick}
        >
          {/* Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              background: 'rgba(70, 70, 90, 0.9)',
              border: '3px solid rgba(0,0,0,0.8)',
              boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
            }}
          >
            <div className="w-full h-full flex flex-col items-center justify-center">
              {/* Camera frame with user icon */}
              <div className="relative w-14 h-14">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/30 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/30 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/30 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/30 rounded-br-lg" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <User className="w-7 h-7 text-white/30" strokeWidth={1.5} />
                </div>
              </div>
              <p className="text-[10px] text-white/40 mt-2 font-medium">Tap to capture</p>
            </div>
          </div>
        </div>
      );
    }

    // Render card with photo
    if (day.photo) {
      const mediaUrl = day.photo.originalUrl || day.photo.url;
      const isVideo = day.photo.isVideo || isVideoUrl(day.photo.url);
      
      return (
        <div
          className="absolute top-1/2 left-1/2 transition-all duration-500 ease-out cursor-pointer"
          style={{
            transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
            zIndex,
          }}
          onClick={() => handlePhotoTap(day.photo!)}
        >
          {/* Activity icon floating on top-right */}
          {activityIcon && (
            <div 
              className="absolute -top-3 -right-3 w-9 h-9 rounded-lg flex items-center justify-center z-10"
              style={{
                background: 'rgba(30, 30, 50, 0.95)',
                border: '2px solid rgba(0,0,0,0.9)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              <img src={activityIcon} alt="" className="w-5 h-5 object-contain" />
            </div>
          )}
          
          {/* Photo Card */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              width: `${cardWidth}px`,
              height: `${cardHeight}px`,
              border: '3px solid rgba(0,0,0,0.9)',
              boxShadow: isCenter ? '0 15px 40px rgba(0,0,0,0.5)' : '0 8px 25px rgba(0,0,0,0.3)',
            }}
          >
            {isVideo ? (
              <video
                src={mediaUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
                autoPlay
                loop
              />
            ) : (
              <img
                src={mediaUrl}
                alt=""
                className="w-full h-full object-cover"
              />
            )}
          </div>
          
          {/* Date label at bottom */}
          <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
            <p 
              className="text-sm font-bold tracking-wide whitespace-nowrap"
              style={{
                color: 'rgba(255,255,255,0.9)',
                textShadow: '0 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)',
                fontStyle: 'italic',
              }}
            >
              {day.displayDate}
            </p>
          </div>
        </div>
      );
    }

    // Render empty past card (missed day)
    return (
      <div
        className="absolute top-1/2 left-1/2 transition-all duration-500 ease-out"
        style={{
          transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
          zIndex,
        }}
      >
        {/* Card */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            background: 'rgba(70, 70, 90, 0.7)',
            border: '3px solid rgba(0,0,0,0.8)',
          }}
        >
          <div className="w-full h-full flex flex-col items-center justify-center">
            <p className="text-[10px] text-white/20 font-medium">Missed</p>
          </div>
        </div>
        
        {/* Date label */}
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          <p 
            className="text-xs font-bold tracking-wide"
            style={{
              color: 'rgba(255,255,255,0.4)',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {day.displayDate}
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full flex justify-center items-center" style={{ height: '280px' }}>
      <div className="relative w-full" style={{ height: '240px' }}>
        {days.map((day, index) => (
          <DayCardComponent key={day.dateString} day={day} position={index} />
        ))}
      </div>
    </div>
  );
};

export default StackedPhotoCards;
