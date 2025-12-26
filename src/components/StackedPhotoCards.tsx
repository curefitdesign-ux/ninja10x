import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, addDays, startOfDay } from 'date-fns';
import shuttlecockIcon from '@/assets/frames/shuttlecock.png';

interface Photo {
  id: string;
  url: string;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue';
  duration?: string;
  pr?: string;
  uploadDate: string;
}

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
      isLocked: !todaysPhoto, // Locked until today's photo is uploaded
    },
  ];

  const handlePhotoTap = (photo: Photo) => {
    navigate('/preview', { 
      state: { 
        imageUrl: photo.url, 
        activity: photo.activity,
        frame: photo.frame,
        duration: photo.duration,
        pr: photo.pr,
        isReview: true
      } 
    });
  };

  // Card component for each day
  const DayCardComponent = ({ day, position }: { day: DayCard; position: number }) => {
    const isCenter = position === 1;
    const isLeft = position === 0;
    const isRight = position === 2;
    
    // Calculate transforms based on position - side cards overlap center
    const getTransform = () => {
      if (isCenter) {
        return { translateX: 0, scale: 1, rotate: 0, zIndex: 30 };
      } else if (isLeft) {
        return { translateX: -70, scale: 0.9, rotate: -6, zIndex: 20 };
      } else {
        return { translateX: 70, scale: 0.9, rotate: 6, zIndex: 20 };
      }
    };
    
    const { translateX, scale, rotate, zIndex } = getTransform();
    const opacity = isCenter ? 1 : 0.9;
    
    // Card base styles
    const cardWidth = isCenter ? 160 : 140;
    const cardHeight = isCenter ? 200 : 180;

    // Render locked upcoming card
    if (day.isLocked) {
      return (
        <div
          className="absolute top-1/2 left-1/2 rounded-2xl overflow-hidden transition-all duration-500 ease-out"
          style={{
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
            zIndex,
            opacity: 0.7,
            background: 'rgba(70, 70, 90, 0.8)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-2">
              <Lock className="w-5 h-5 text-white/40" />
            </div>
            <p className="text-[10px] text-white/40 font-medium tracking-wider">{day.displayDate}</p>
          </div>
        </div>
      );
    }

    // Render active card without photo (today's upload)
    if (day.state === 'active' && !day.photo) {
      return (
        <div
          className="absolute top-1/2 left-1/2 rounded-2xl overflow-hidden transition-all duration-500 ease-out cursor-pointer"
          style={{
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
            zIndex,
            opacity,
            background: 'rgba(70, 70, 90, 0.9)',
            border: '2px solid rgba(255,255,255,0.25)',
            boxShadow: '0 15px 40px rgba(0,0,0,0.3)',
          }}
          onClick={onCardClick}
        >
          <div className="w-full h-full flex flex-col items-center justify-center">
            {/* Camera frame with user icon */}
            <div className="relative w-16 h-16">
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white/30 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white/30 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white/30 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white/30 rounded-br-lg" />
              <div className="absolute inset-0 flex items-center justify-center">
                <User className="w-8 h-8 text-white/30" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-xs text-white/50 mt-3 font-medium">Today's capture</p>
          </div>
        </div>
      );
    }

    // Render card with photo (past or uploaded today)
    if (day.photo) {
      return (
        <div
          className="absolute top-1/2 left-1/2 rounded-2xl overflow-hidden transition-all duration-500 ease-out cursor-pointer"
          style={{
            width: `${cardWidth}px`,
            height: `${cardHeight}px`,
            transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
            zIndex,
            opacity,
            boxShadow: isCenter ? '0 15px 40px rgba(0,0,0,0.4)' : '0 8px 25px rgba(0,0,0,0.2)',
            border: '2px solid rgba(0,0,0,0.3)',
          }}
          onClick={() => handlePhotoTap(day.photo!)}
        >
          <img
            src={day.photo.url}
            alt={day.photo.activity || 'Photo'}
            className="w-full h-full object-cover"
          />
          
          {/* Small thumbnail photo in corner */}
          <div 
            className="absolute top-2 right-2 w-10 h-12 rounded-lg overflow-hidden border-2 border-black/50 shadow-lg"
            style={{ transform: 'rotate(8deg)' }}
          >
            <img
              src={day.photo.url}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Activity icon */}
          <div className="absolute top-1 right-0 w-8 h-8">
            <img src={shuttlecockIcon} alt="" className="w-full h-full object-contain" />
          </div>
          
          {/* Date overlay */}
          <div className="absolute bottom-2 left-2 right-2">
            <p 
              className="text-white text-sm font-bold tracking-wide italic"
              style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.8)' }}
            >
              {day.displayDate}
            </p>
          </div>
        </div>
      );
    }

    // Render empty past card (missed day) or empty upcoming card
    return (
      <div
        className="absolute top-1/2 left-1/2 rounded-2xl overflow-hidden transition-all duration-500 ease-out"
        style={{
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
          zIndex,
          opacity: 0.7,
          background: 'rgba(70, 70, 90, 0.8)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="w-full h-full flex flex-col items-center justify-center">
          <p className="text-[10px] text-white/30 font-medium tracking-wider">{day.displayDate}</p>
          {day.state === 'past' && <p className="text-[10px] text-white/20 mt-1">Missed</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full flex justify-center items-center" style={{ height: '260px' }}>
      <div className="relative w-full" style={{ height: '220px' }}>
        {days.map((day, index) => (
          <DayCardComponent key={day.dateString} day={day} position={index} />
        ))}
      </div>
    </div>
  );
};

export default StackedPhotoCards;
