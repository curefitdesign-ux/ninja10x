import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import StackedPhotoCards from './StackedPhotoCards';
import WeekProgress from './WeekProgress';
import cardBackground from '@/assets/card-background.png';
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

interface PhotoUploadCardProps {
  photos: Photo[];
  onCardClick?: () => void; // Optional - now navigates to gallery page
  hasUploadedToday?: boolean;
  hoursUntilNextUpload?: number;
  currentDate: string;
}

const PhotoUploadCard = ({ 
  photos, 
  currentDate
}: PhotoUploadCardProps) => {
  const navigate = useNavigate();
  
  // Calculate next day number for new uploads
  const nextDayNumber = photos.length > 0 ? Math.max(...photos.map(p => p.dayNumber)) + 1 : 1;
  
  const handleAddPhoto = () => {
    navigate('/gallery', {
      state: { dayNumber: nextDayNumber },
    });
  };
  // Determine current week based on photos (3 photos per week = 12 total for 4 weeks)
  const currentWeek = Math.min(Math.floor(photos.length / 3) + 1, 4);

  // Calculate photos per week
  const photosPerWeek = [
    Math.min(photos.length, 3),
    Math.min(Math.max(photos.length - 3, 0), 3),
    Math.min(Math.max(photos.length - 6, 0), 3),
    Math.min(Math.max(photos.length - 9, 0), 3),
  ];

  return (
    <div className="px-5">
      {/* Ninja Widget */}
      <div 
        className="glass-card p-5 relative overflow-hidden w-full"
        style={{ backgroundImage: `url(${cardBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Cult Ninja Tag */}
        <div className="flex justify-center mb-4">
          <div 
            className="px-4 py-2 rounded-full"
            style={{ 
              background: 'linear-gradient(180deg, rgba(90,90,90,0.85) 0%, rgba(61,61,61,0.85) 100%)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 15px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <span className="text-sm font-semibold text-foreground tracking-wider">CULT NINJA</span>
          </div>
        </div>
        
        {/* Title */}
        <h2 className="text-xl font-bold text-foreground text-center mb-6 relative z-10">
          CONQUER WILL POWER
        </h2>
      
        {/* Stacked Photo Cards */}
        <div className="relative z-10 mb-4">
          <StackedPhotoCards 
            photos={photos} 
            currentDate={currentDate}
          />
        </div>
      
        {/* Week Progress */}
        <div className="relative z-10">
          <WeekProgress currentWeek={currentWeek} photosPerWeek={photosPerWeek} />
        </div>
      </div>

      {/* Animated Upload Button Below Widget */}
      <div className="flex justify-center mt-4">
        <motion.button
          onClick={handleAddPhoto}
          className="relative flex items-center gap-2 px-6 py-3 rounded-full overflow-visible"
          style={{
            background: 'linear-gradient(135deg, #FF4D4D 0%, #FF3333 100%)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            boxShadow: [
              '0 0 20px rgba(255, 77, 77, 0.4), 0 0 40px rgba(255, 77, 77, 0.2)',
              '0 0 30px rgba(255, 77, 77, 0.6), 0 0 60px rgba(255, 77, 77, 0.3)',
              '0 0 20px rgba(255, 77, 77, 0.4), 0 0 40px rgba(255, 77, 77, 0.2)',
            ],
          }}
          transition={{
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        >
          {/* Outer glow ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, #FF4D4D 0%, #FF3333 100%)',
              filter: 'blur(12px)',
              opacity: 0.5,
            }}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Inner pulse ring */}
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-white/30"
            animate={{
              scale: [1, 1.3, 1.5],
              opacity: [0.6, 0.3, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
          
          {/* Button content */}
          <motion.div 
            className="relative z-10 flex items-center gap-2"
            animate={{
              y: [0, -2, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <motion.div
              animate={{
                rotate: [0, 90, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Plus className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-white font-semibold text-sm">Add Photo</span>
          </motion.div>
        </motion.button>
      </div>
    </div>
  );
};

export default PhotoUploadCard;
