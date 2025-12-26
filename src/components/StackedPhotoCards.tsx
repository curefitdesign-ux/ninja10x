import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, addDays, isToday, isBefore, isAfter, startOfDay } from 'date-fns';

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
      displayDate: 'TODAY',
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
    
    // Calculate transforms based on position
    const getTransform = () => {
      if (isCenter) {
        return { translateX: 0, scale: 1, rotate: 0 };
      } else if (isLeft) {
        return { translateX: -85, scale: 0.85, rotate: -8 };
      } else {
        return { translateX: 85, scale: 0.85, rotate: 8 };
      }
    };
    
    const { translateX, scale, rotate } = getTransform();
    const zIndex = isCenter ? 100 : 50;
    const opacity = isCenter ? 1 : 0.85;

    // Render locked upcoming card
    if (day.isLocked) {
      return (
        <div
          className="absolute top-1/2 left-1/2 rounded-3xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
          style={{
            width: '200px',
            height: '260px',
            transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
            zIndex,
            opacity: 0.6,
            background: 'linear-gradient(145deg, rgba(40,40,40,0.95) 0%, rgba(20,20,20,0.98) 100%)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div className="w-full h-full flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mb-3">
              <Lock className="w-6 h-6 text-white/50" />
            </div>
            <p className="text-xs text-white/40 font-medium tracking-wider">{day.displayDate}</p>
          </div>
        </div>
      );
    }

    // Render active card without photo (today's upload)
    if (day.state === 'active' && !day.photo) {
      return (
        <div
          className="absolute top-1/2 left-1/2 rounded-3xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer"
          style={{
            width: '200px',
            height: '260px',
            transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
            zIndex,
            opacity,
            background: 'linear-gradient(145deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.08) 100%)',
            border: '2px solid rgba(255,255,255,0.4)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          }}
          onClick={onCardClick}
        >
          <div className="w-full h-full flex flex-col items-center justify-center">
            {/* Camera frame with user icon */}
            <div className="relative w-20 h-20">
              <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-foreground/40 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-foreground/40 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-foreground/40 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-foreground/40 rounded-br-xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <User className="w-10 h-10 text-foreground/40" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-sm text-foreground/50 mt-4 font-medium">Today's capture</p>
          </div>
        </div>
      );
    }

    // Render card with photo (past or uploaded today)
    if (day.photo) {
      return (
        <div
          className="absolute top-1/2 left-1/2 rounded-3xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] cursor-pointer"
          style={{
            width: '200px',
            height: '260px',
            transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
            zIndex,
            opacity,
            boxShadow: isCenter ? '0 20px 50px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.2)',
          }}
          onClick={() => handlePhotoTap(day.photo!)}
        >
          <img
            src={day.photo.url}
            alt={day.photo.activity || 'Photo'}
            className="w-full h-full object-cover"
          />
          {/* Date overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
            <p className="text-white text-sm font-bold tracking-wide text-center">
              {day.displayDate}
            </p>
          </div>
        </div>
      );
    }

    // Render empty past card (missed day)
    return (
      <div
        className="absolute top-1/2 left-1/2 rounded-3xl overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          width: '200px',
          height: '260px',
          transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`,
          zIndex,
          opacity: 0.5,
          background: 'linear-gradient(145deg, rgba(60,60,60,0.6) 0%, rgba(30,30,30,0.8) 100%)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="w-full h-full flex flex-col items-center justify-center">
          <p className="text-xs text-white/30 font-medium tracking-wider">{day.displayDate}</p>
          <p className="text-xs text-white/20 mt-1">Missed</p>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full flex justify-center items-center" style={{ height: '340px' }}>
      <div className="relative w-full" style={{ height: '280px' }}>
        {days.map((day, index) => (
          <DayCardComponent key={day.dateString} day={day} position={index} />
        ))}
      </div>
    </div>
  );
};

export default StackedPhotoCards;
