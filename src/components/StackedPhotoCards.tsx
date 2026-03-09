import { useState, useEffect, useRef } from 'react';
import { User, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMorphTransition } from '@/hooks/use-morph-transition';

import plusIcon from '@/assets/icons/plus-icon.png';
import cyclingIcon from '@/assets/activities/cycling.png';
import runningIcon from '@/assets/activities/running.png';
import yogaIcon from '@/assets/activities/yoga.png';
import footballIcon from '@/assets/activities/football.png';
import cricketIcon from '@/assets/activities/cricket.png';
import trekkingIcon from '@/assets/activities/trekking.png';
import boxingIcon from '@/assets/activities/boxing.png';
import basketballIcon from '@/assets/activities/basketball.png';
import racquetIcon from '@/assets/activities/racquet.png';

// 3D Reaction assets
import { ALL_REACTION_IMAGES } from '@/lib/reaction-images';

import { ReactionType } from '@/services/journey-service';

interface Photo {
  id: string;
  storageUrl: string;
  originalUrl?: string;
  isVideo?: boolean;
  activity?: string;
  frame?: 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';
  duration?: string;
  pr?: string;
  dayNumber: number;
  reactions?: Partial<Record<ReactionType, { count: number }>>;
}

const isVideoUrl = (url: string) => url.startsWith('data:video') || /\.(mp4|webm|mov|avi)$/i.test(url);

const activityIcons: { [key: string]: string } = {
  'Cycling': cyclingIcon, 'Running': runningIcon, 'Yoga': yogaIcon, 'Football': footballIcon,
  'Cricket': cricketIcon, 'Trekking': trekkingIcon, 'Boxing': boxingIcon, 'Basketball': basketballIcon, 'Racquet': racquetIcon,
};

const REACTION_IMAGES = ALL_REACTION_IMAGES;

interface StackedPhotoCardsProps {
  photos: Photo[];
  onCardClick?: () => void;
  currentDate: string;
}

const StackedPhotoCards = ({ photos }: StackedPhotoCardsProps) => {
  const navigate = useNavigate();
  const { triggerMorph } = useMorphTransition();
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const latestPhoto = photos.length > 0 ? photos[photos.length - 1] : null;
  
  // Preload the latest 3 images immediately for instant rendering
  const displayPhotos = photos.slice(-3).reverse();
  const preloadedUrls = useRef(new Set<string>());
  
  useEffect(() => {
    displayPhotos.forEach(photo => {
      const url = photo.originalUrl || photo.storageUrl;
      if (url && !preloadedUrls.current.has(url)) {
        preloadedUrls.current.add(url);
        const img = new window.Image();
        img.src = url;
      }
    });
  }, [photos.length]);
  
  const existingDays = new Set(photos.map(p => p.dayNumber));
  const nextDayNumber = (() => {
    for (let day = 1; day <= 12; day++) {
      if (!existingDays.has(day)) return day;
    }
    return 13;
  })();
  
  const handleEmptyCardTap = () => {
    navigate('/gallery', {
      state: { dayNumber: nextDayNumber },
    });
  };

  const handlePhotoTap = (photo: Photo) => {
    const el = cardRefs.current.get(photo.id);
    if (el) {
      triggerMorph(
        el,
        photo.storageUrl,
        '/reel',
        { activityId: photo.id, dayNumber: photo.dayNumber },
        photo.isVideo
      );
    } else {
      navigate('/reel', {
        state: { activityId: photo.id, dayNumber: photo.dayNumber },
      });
    }
  };

  const visiblePhotos = displayPhotos;
  
  // Get active reaction types for a photo
  const getActiveReactions = (photo: Photo): ReactionType[] => {
    if (!photo.reactions) return [];
    return (Object.entries(photo.reactions) as [ReactionType, { count: number }][])
      .filter(([, r]) => r.count > 0)
      .map(([type]) => type);
  };
  
  const CardComponent = ({ photo, position }: { photo: Photo | null; position: number }) => {
    const isCenter = position === 0;
    const translateX = position === 0 ? 0 : position === 1 ? -70 : 70;
    const scale = isCenter ? 1 : 0.85;
    const rotate = position === 0 ? 0 : position === 1 ? -8 : 8;
    const zIndex = 30 - position * 10;
    
    // Use 9:16 aspect ratio like the reel
    const cardWidth = isCenter ? 140 : 120;
    const cardHeight = isCenter ? 228 : 196; // slightly shorter

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

    // Prefer original clean image for card display (no frame overlay text)
    const displayUrl = photo.originalUrl || photo.storageUrl;
    const isVideo = photo.isVideo || isVideoUrl(displayUrl);
    const activityIcon = photo.activity ? activityIcons[photo.activity] : null;
    const activeReactions = getActiveReactions(photo);

    // Positions for floating emojis around the card
    const emojiPositions = [
      { top: -10, right: -12, rotate: 15 },
      { bottom: 20, left: -14, rotate: -10 },
      { top: '40%', right: -16, rotate: 8 },
      { bottom: '30%', left: -10, rotate: -12 },
    ];

    return (
      <div 
        className="absolute top-1/2 left-1/2 cursor-pointer" 
        style={{ transform: `translate(-50%, -50%) translateX(${translateX}px) scale(${scale}) rotate(${rotate}deg)`, zIndex }} 
        onClick={() => handlePhotoTap(photo)}
      >
        {/* Floating 3D emoji reactions around card edges */}
        {isCenter && activeReactions.slice(0, 4).map((type, idx) => {
          const pos = emojiPositions[idx];
          return (
            <motion.div
              key={type}
              className="absolute z-50 pointer-events-none"
              style={{
                ...(pos.top !== undefined && typeof pos.top === 'number' && { top: pos.top }),
                ...(pos.top !== undefined && typeof pos.top === 'string' && { top: pos.top }),
                ...(pos.bottom !== undefined && typeof pos.bottom === 'number' && { bottom: pos.bottom }),
                ...(pos.bottom !== undefined && typeof pos.bottom === 'string' && { bottom: pos.bottom }),
                ...(pos.left !== undefined && { left: pos.left }),
                ...(pos.right !== undefined && { right: pos.right }),
              }}
              initial={{ scale: 0, rotate: pos.rotate }}
              animate={{ 
                scale: [0.9, 1.1, 1],
                y: [0, -3, 0],
              }}
              transition={{
                scale: { duration: 0.4, delay: idx * 0.1 },
                y: { duration: 2, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.3 },
              }}
            >
              <img 
                src={REACTION_IMAGES[type]} 
                alt={type} 
                className="w-7 h-7 object-contain drop-shadow-lg"
                style={{
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
                }}
              />
            </motion.div>
          );
        })}

        {activityIcon && (
          <div className="absolute -top-3 -right-3 w-9 h-9 rounded-lg flex items-center justify-center z-10" style={{ background: 'rgba(30, 30, 50, 0.95)', border: '2px solid rgba(0,0,0,0.9)' }}>
            <img src={activityIcon} alt="" className="w-5 h-5 object-contain" />
          </div>
        )}
        <div className="overflow-hidden" style={{ width: `${cardWidth}px`, height: `${cardHeight}px`, borderRadius: isCenter ? '26px' : '16px', border: '3px solid rgba(0,0,0,0.9)', boxShadow: isCenter ? '0 15px 40px rgba(0,0,0,0.5)' : '0 8px 25px rgba(0,0,0,0.3)' }}>
          {isVideo ? <video src={displayUrl} className="w-full h-full object-cover" muted playsInline autoPlay loop preload="auto" /> : <img src={displayUrl} alt="" className="w-full h-full object-cover" loading="eager" decoding="async" fetchPriority="high" />}
        </div>
      </div>
    );
  };

  // Show plus icon when current week isn't complete and journey isn't done
  const currentWeekPhotos = photos.length % 3;
  const showPlusIcon = photos.length < 12 && photos.length > 0;

  return (
    <div
      className="relative w-full flex justify-center items-center"
      style={{ height: '320px' }}
      data-shared-element="cult-ninja-widget"
    >
      <div className="relative w-full" style={{ height: '280px' }}>
        {visiblePhotos.length === 0 ? (
          <CardComponent photo={null} position={0} />
        ) : (
          visiblePhotos.map((photo, idx) => <CardComponent key={photo.id} photo={photo} position={idx} />)
        )}

        {/* Plus icon to log next activity */}
        {showPlusIcon && (
          <motion.div
            className="absolute z-50 cursor-pointer"
            style={{ 
              top: '50%',
              left: '50%',
              transform: 'translate(30px, 50px)',
            }}
            onClick={handleEmptyCardTap}
            whileTap={{ scale: 0.9 }}
          >
            <img src={plusIcon} alt="Add activity" className="w-8 h-8 drop-shadow-lg" />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default StackedPhotoCards;

