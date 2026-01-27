import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  storageUrl: string;
  isVideo?: boolean;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';
  duration?: string;
  pr?: string;
  dayNumber: number;
}

const isVideoUrl = (url: string) => url.startsWith('data:video') || /\.(mp4|webm|mov|avi)$/i.test(url);

const activityIcons: { [key: string]: string } = {
  'Cycling': cyclingIcon, 'Running': runningIcon, 'Yoga': yogaIcon, 'Football': footballIcon,
  'Cricket': cricketIcon, 'Trekking': trekkingIcon, 'Boxing': boxingIcon, 'Basketball': basketballIcon, 'Racquet': racquetIcon,
};

interface StackedPhotoCardsProps {
  photos: Photo[];
  onCardClick?: () => void; // Optional, now navigates to gallery/camera pages
  currentDate: string;
}

const StackedPhotoCards = ({ photos }: StackedPhotoCardsProps) => {
  const navigate = useNavigate();
  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  
  // Calculate next day number for new uploads
  const nextDayNumber = photos.length > 0 ? Math.max(...photos.map(p => p.dayNumber)) + 1 : 1;
  
  const handleEmptyCardTap = () => {
    // Navigate to gallery page (has camera option inside)
    navigate('/gallery', {
      state: { dayNumber: nextDayNumber },
    });
  };

  const handlePhotoTap = (photo: Photo) => {
    navigate('/preview', {
      state: { 
        imageUrl: photo.storageUrl, 
        originalUrl: photo.storageUrl, 
        isVideo: photo.isVideo, 
        activity: photo.activity, 
        frame: photo.frame, 
        duration: photo.duration, 
        pr: photo.pr, 
        isReview: true, 
        photoId: photo.id,
        dayNumber: photo.dayNumber,
      },
    });
  };

  // Show last 3 photos as stacked cards
  const displayPhotos = photos.slice(-3).reverse();
  
  const CardComponent = ({ photo, position }: { photo: Photo | null; position: number }) => {
    const isCenter = position === 0;
    const translateX = position === 0 ? 0 : position === 1 ? -70 : 70;
    const scale = isCenter ? 1 : 0.85;
    const rotate = position === 0 ? 0 : position === 1 ? -8 : 8;
    const zIndex = 30 - position * 10;
    const cardWidth = isCenter ? 150 : 130;
    const cardHeight = isCenter ? 190 : 165;

    if (!photo) {
      return (
        <div className="absolute top-1/2 left-1/2 cursor-pointer" style={{ transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`, zIndex }} onClick={handleEmptyCardTap}>
          <div className="rounded-2xl overflow-hidden" style={{ width: `${cardWidth}px`, height: `${cardHeight}px`, background: 'rgba(70, 70, 90, 0.9)', border: '3px solid rgba(0,0,0,0.8)' }}>
            <div className="w-full h-full flex flex-col items-center justify-center">
              <div className="relative w-14 h-14">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white/30 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white/30 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white/30 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white/30 rounded-br-lg" />
                <div className="absolute inset-0 flex items-center justify-center"><User className="w-7 h-7 text-white/30" strokeWidth={1.5} /></div>
              </div>
              <p className="text-[10px] text-white/40 mt-2 font-medium">Tap to capture</p>
            </div>
          </div>
        </div>
      );
    }

    const isVideo = photo.isVideo || isVideoUrl(photo.storageUrl);
    const activityIcon = photo.activity ? activityIcons[photo.activity] : null;

    return (
      <div className="absolute top-1/2 left-1/2 cursor-pointer" style={{ transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`, zIndex }} onClick={() => handlePhotoTap(photo)}>
        {activityIcon && (
          <div className="absolute -top-3 -right-3 w-9 h-9 rounded-lg flex items-center justify-center z-10" style={{ background: 'rgba(30, 30, 50, 0.95)', border: '2px solid rgba(0,0,0,0.9)' }}>
            <img src={activityIcon} alt="" className="w-5 h-5 object-contain" />
          </div>
        )}
        <div className="rounded-2xl overflow-hidden" style={{ width: `${cardWidth}px`, height: `${cardHeight}px`, border: '3px solid rgba(0,0,0,0.9)', boxShadow: isCenter ? '0 15px 40px rgba(0,0,0,0.5)' : '0 8px 25px rgba(0,0,0,0.3)' }}>
          {isVideo ? <video src={photo.storageUrl} className="w-full h-full object-cover" muted playsInline autoPlay loop /> : <img src={photo.storageUrl} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
          <p className="text-sm font-bold tracking-wide whitespace-nowrap italic" style={{ color: 'rgba(255,255,255,0.9)', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>DAY {photo.dayNumber}</p>
        </div>
      </div>
    );
  };

  return (
    <div
      className="relative w-full flex justify-center items-center"
      style={{ height: '280px' }}
      data-shared-element="cult-ninja-widget"
    >
      <div className="relative w-full" style={{ height: '240px' }}>
        {displayPhotos.length === 0 ? (
          <CardComponent photo={null} position={0} />
        ) : (
          displayPhotos.map((photo, idx) => <CardComponent key={photo.id} photo={photo} position={idx} />)
        )}
      </div>
    </div>
  );
};

export default StackedPhotoCards;

