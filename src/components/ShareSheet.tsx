import { X, Download, Copy, Check, Pencil, Loader2 } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ShakyFrame from '@/components/frames/ShakyFrame';
import JournalFrame from '@/components/frames/JournalFrame';
import VogueFrame from '@/components/frames/VogueFrame';
import FitnessFrame from '@/components/frames/FitnessFrame';
import TicketFrame from '@/components/frames/TicketFrame';
import ReelProgressPill from '@/components/ReelProgressPill';
import { useJourneyActivities } from '@/hooks/use-journey-activities';
import { useFitnessReel } from '@/hooks/use-fitness-reel';
import weekRecapVideo from '@/assets/demo-videos/week-recap.mp4';

type FrameType = 'shaky' | 'journal' | 'vogue' | 'fitness' | 'ticket';

interface FrameProps {
  imageUrl: string;
  isVideo: boolean;
  activity: string;
  week: number;
  day: number;
  duration: string;
  pr: string;
  imagePosition: { x: number; y: number };
  imageScale: number;
  label1: string;
  label2: string;
}

interface ShareSheetProps {
  imageUrl: string;
  isVideo?: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onSaveWithTemplate?: () => void;
  dayNumber?: number;
  frameType?: FrameType;
  frameProps?: FrameProps;
}

// Social platform icons with brand colors and deep linking
const socialApps = [
  { 
    name: 'WhatsApp', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    color: '#25D366',
    share: (text: string) => `whatsapp://send?text=${encodeURIComponent(text)}`
  },
  { 
    name: 'Instagram', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
    color: '#E4405F',
    share: () => `instagram://`
  },
  { 
    name: 'X', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
      </svg>
    ),
    color: '#000000',
    share: (text: string) => `twitter://post?message=${encodeURIComponent(text)}`
  },
  { 
    name: 'Facebook', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    color: '#1877F2',
    share: (text: string) => `fb://publish/profile/me?text=${encodeURIComponent(text)}`
  },
  { 
    name: 'Telegram', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
    color: '#0088cc',
    share: (text: string) => `tg://msg?text=${encodeURIComponent(text)}`
  },
  { 
    name: 'Snapchat', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.076-.375-.09-.84-.195-1.455-.195-.405 0-.84.045-1.29.135-.63.135-1.2.57-1.815 1.035-.855.63-1.725 1.29-2.91 1.29h-.075c-1.2-.015-2.055-.66-2.91-1.275-.615-.465-1.185-.9-1.815-1.035-.435-.09-.87-.135-1.29-.135-.66 0-1.11.105-1.455.195-.24.06-.42.076-.54.076h-.03c-.285 0-.48-.135-.555-.42-.06-.181-.105-.375-.135-.554-.029-.196-.104-.464-.165-.555-1.858-.284-2.895-.702-3.135-1.275-.03-.074-.045-.149-.045-.224 0-.24.18-.465.435-.509 3.27-.539 4.737-3.878 4.792-4.014l.016-.03c.18-.33.195-.63.119-.855-.195-.465-.884-.689-1.333-.824-.135-.045-.255-.09-.344-.119-.809-.315-1.214-.705-1.214-1.154 0-.33.27-.659.689-.808.15-.061.33-.09.509-.09.12 0 .285.016.435.09.391.165.72.27 1.02.286.315 0 .435-.06.465-.075l-.015-.226c-.105-1.627-.225-3.654.3-4.832C6.32 1.071 9.676.793 10.664.793h1.542z"/>
      </svg>
    ),
    color: '#FFFC00',
    share: () => `snapchat://`
  },
  { 
    name: 'LinkedIn', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    color: '#0A66C2',
    share: (text: string) => `linkedin://shareArticle?mini=true&summary=${encodeURIComponent(text)}`
  },
  { 
    name: 'Messages', 
    icon: (
      <svg viewBox="0 0 24 24" className="w-7 h-7" fill="currentColor">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z"/>
        <path d="M7 9h2v2H7zm4 0h2v2h-2zm4 0h2v2h-2z"/>
      </svg>
    ),
    color: '#34C759',
    share: (text: string) => `sms:?body=${encodeURIComponent(text)}`
  },
];

const ShareSheet = ({ imageUrl, isVideo, onClose, onEdit, onSaveWithTemplate, dayNumber, frameType, frameProps }: ShareSheetProps) => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [dominantColor, setDominantColor] = useState('rgba(0,0,0,0.95)');
  const [isExiting, setIsExiting] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Get activities and reel hooks
  const { activities } = useJourneyActivities();
  const { 
    generateReel, 
    isGenerating: isGeneratingReel, 
    currentStep: reelStep,
    currentReel,
  } = useFitnessReel();

  // Week-specific configuration
  const weekConfig: Record<number, { week: number; title: string; startDay: number; endDay: number }> = {
    3: { week: 1, title: 'Conquer Will Power', startDay: 1, endDay: 3 },
    6: { week: 2, title: 'Build Energy', startDay: 4, endDay: 6 },
    9: { week: 3, title: 'Increase Stamina', startDay: 7, endDay: 9 },
    12: { week: 4, title: 'Build Strength', startDay: 10, endDay: 12 },
  };

  // Check if current day is a week-end day (3, 6, 9, 12)
  const isWeekEnd = dayNumber ? [3, 6, 9, 12].includes(dayNumber) : false;
  const currentWeekConfig = dayNumber ? weekConfig[dayNumber] : null;

  // Auto-trigger reel generation at week ends
  const [reelTriggered, setReelTriggered] = useState(false);
  
  useEffect(() => {
    // Trigger reel generation on week-end uploads (3, 6, 9, 12)
    if (isWeekEnd && currentWeekConfig && !reelTriggered && !isGeneratingReel && !currentReel) {
      const weekActivities = activities.filter(
        a => a.dayNumber >= currentWeekConfig.startDay && a.dayNumber <= currentWeekConfig.endDay
      );
      
      if (weekActivities.length >= 3) {
        setReelTriggered(true);
        
        // Prepare photo data for reel generation
        const photoData = weekActivities.map(a => ({
          id: a.id,
          imageUrl: a.storageUrl,
          activity: a.activity || 'Activity',
          duration: a.duration || '',
          pr: a.pr || '',
          uploadDate: new Date().toISOString(),
          dayNumber: a.dayNumber,
        }));
        
        generateReel(photoData);
      }
    }
  }, [dayNumber, activities, reelTriggered, isGeneratingReel, currentReel, generateReel, isWeekEnd, currentWeekConfig]);

  // Calculate reel progress
  const reelProgress = (() => {
    if (!isGeneratingReel) {
      return currentReel?.videoUrl ? 100 : 0;
    }
    switch (reelStep) {
      case 'narration': return 25;
      case 'voiceover': return 50;
      case 'video': return 75;
      case 'complete': return 100;
      default: return 0;
    }
  })();

  // Prepare photos for widget display - show current week's photos only
  const reelPhotos = currentWeekConfig 
    ? activities
        .filter(a => a.dayNumber >= currentWeekConfig.startDay && a.dayNumber <= currentWeekConfig.endDay)
        .map(a => ({
          imageUrl: a.storageUrl,
          activity: a.activity || 'Activity',
          dayNumber: a.dayNumber,
        }))
    : [];
  
  const shareText = '🏃 Check out my fitness activity! #FitnessJourney #HealthyLifestyle';
  const shareUrl = window.location.href;
  const fullShareText = `${shareText}\n\n${shareUrl}`;

  // Extract dominant color from image
  useEffect(() => {
    if (isVideo || !imageUrl) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      canvas.width = 50;
      canvas.height = 50;
      ctx.drawImage(img, 0, 0, 50, 50);
      
      const imageData = ctx.getImageData(0, 0, 50, 50).data;
      let r = 0, g = 0, b = 0, count = 0;
      
      for (let i = 0; i < imageData.length; i += 4) {
        r += imageData[i];
        g += imageData[i + 1];
        b += imageData[i + 2];
        count++;
      }
      
      r = Math.floor(r / count);
      g = Math.floor(g / count);
      b = Math.floor(b / count);
      
      // Darken the color for better contrast
      const darkenFactor = 0.3;
      r = Math.floor(r * darkenFactor);
      g = Math.floor(g * darkenFactor);
      b = Math.floor(b * darkenFactor);
      
      setDominantColor(`rgb(${r},${g},${b})`);
    };
    img.src = imageUrl;
  }, [imageUrl, isVideo]);

  // Handle VIEW PROGRESS - navigate to progress page with exit animation
  const handleViewProgress = () => {
    triggerHaptic('success');
    
    // Set exiting state for smooth animation
    setIsExiting(true);
    
    // Navigate after exit animation completes
    setTimeout(() => {
      navigate('/progress', {
        replace: true,
        state: {
          fromShare: true,
          transitionImage: imageUrl,
          transitionToProgress: true,
          dayNumber,
          frameType,
          frameProps,
        },
      });
    }, 250);
  };

  // Close with X - shared-element transition back to Activity page (PhotoLoggingWidget)
  const handleCloseToHome = () => {
    triggerHaptic('light');
    setIsExiting(true);
    
    // Wait for animation, then navigate to Activity page (/)
    setTimeout(() => {
      navigate('/', {
        replace: true,
        state: {
          fromShare: true,
          transitionImage: imageUrl,
          transitionToWidget: true, // Animation goes to photo widget
          dayNumber,
          frameType,
          frameProps,
        },
      });
    }, 500);
  };
  
  const handleShare = async (app: typeof socialApps[0]) => {
    triggerHaptic('medium');
    
    // Web fallback URLs for each platform
    const webFallbacks: Record<string, string> = {
      'WhatsApp': `https://wa.me/?text=${encodeURIComponent(fullShareText)}`,
      'X': `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
      'Facebook': `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`,
      'Telegram': `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
      'LinkedIn': `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      'Instagram': `https://instagram.com`,
      'Snapchat': `https://snapchat.com`,
      'Messages': `sms:?body=${encodeURIComponent(fullShareText)}`,
    };
    
    // Try native share first for supported apps
    if (navigator.share && ['WhatsApp', 'Messages'].includes(app.name)) {
      try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const file = new File([blob], `activity.${isVideo ? 'mp4' : 'png'}`, { type: blob.type });
        
        await navigator.share({
          title: 'My Fitness Activity',
          text: shareText,
          files: [file],
        });
        return;
      } catch (err) {
        console.log('Native share failed, using deep link');
      }
    }
    
    // Try deep link first, then fallback to web
    const deepLink = app.share(fullShareText);
    
    // For Instagram and Snapchat, go directly to web/app store since they don't support text sharing
    if (['Instagram', 'Snapchat'].includes(app.name)) {
      window.open(webFallbacks[app.name], '_blank', 'noopener,noreferrer');
      return;
    }
    
    if (deepLink) {
      // Attempt deep link
      const start = Date.now();
      window.location.href = deepLink;
      
      // Fallback to web after timeout
      setTimeout(() => {
        if (Date.now() - start < 2000 && webFallbacks[app.name]) {
          window.open(webFallbacks[app.name], '_blank', 'noopener,noreferrer');
        }
      }, 1500);
    } else if (webFallbacks[app.name]) {
      window.open(webFallbacks[app.name], '_blank', 'noopener,noreferrer');
    }
  };

  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'success'>('idle');
  
  const handleDownload = async () => {
    if (downloadState === 'downloading') return;
    
    triggerHaptic('medium');
    setDownloadState('downloading');
    
    try {
      let blob: Blob;
      
      // For base64 or blob URLs, convert to blob
      if (imageUrl.startsWith('data:')) {
        // Convert base64 to blob
        const response = await fetch(imageUrl);
        blob = await response.blob();
      } else if (imageUrl.startsWith('blob:')) {
        const response = await fetch(imageUrl);
        blob = await response.blob();
      } else {
        // For remote URLs (Supabase storage), fetch with no-cors fallback
        try {
          const response = await fetch(imageUrl, { 
            mode: 'cors',
            cache: 'no-cache',
          });
          if (!response.ok) throw new Error('CORS fetch failed');
          blob = await response.blob();
        } catch {
          // Fallback: create an image element and draw to canvas
          const img = new Image();
          img.crossOrigin = 'anonymous';
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = reject;
            img.src = imageUrl + (imageUrl.includes('?') ? '&' : '?') + 't=' + Date.now();
          });
          
          const canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Canvas context failed');
          ctx.drawImage(img, 0, 0);
          
          blob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png', 1.0);
          });
        }
      }
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `activity-${Date.now()}.${isVideo ? 'mp4' : 'png'}`;
      
      // Use click() on iOS Safari requires this approach
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Small delay before cleanup for iOS
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
      
      // Success state with haptic
      triggerHaptic('success');
      setDownloadState('success');
      
      // Show toast with back action
      toast.success('Saved to gallery!', {
        action: {
          label: 'GO BACK',
          onClick: handleCloseToHome,
        },
        duration: 4000,
      });
      
      // Reset state after delay
      setTimeout(() => setDownloadState('idle'), 2000);
    } catch (err) {
      console.error('Download failed:', err);
      setDownloadState('idle');
      triggerHaptic('error');
      toast.error('Download failed. Try again.');
    }
  };

  const handleCopyLink = async () => {
    triggerHaptic('light');
    
    try {
      await navigator.clipboard.writeText(fullShareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  // Render the selected frame template
  const renderFramePreview = () => {
    if (!frameType || !frameProps) {
      // Fallback to plain image
      return isVideo ? (
        <video
          src={imageUrl}
          className="relative z-10 w-full h-full object-cover"
          muted
          playsInline
          autoPlay
          loop
        />
      ) : (
        <img
          src={imageUrl}
          alt="Preview"
          className="relative z-10 w-full h-full object-cover"
          loading="eager"
        />
      );
    }

    // Render the actual frame template
    switch (frameType) {
      case 'shaky':
        return <ShakyFrame {...frameProps} />;
      case 'journal':
        return <JournalFrame {...frameProps} />;
      case 'vogue':
        return <VogueFrame {...frameProps} />;
      case 'fitness':
        return <FitnessFrame {...frameProps} />;
      case 'ticket':
        return <TicketFrame {...frameProps} />;
      default:
        return (
          <img
            src={imageUrl}
            alt="Preview"
            className="relative z-10 w-full h-full object-cover"
            loading="eager"
          />
        );
    }
  };

  return (
    <>
      {/* Hidden canvas for color extraction */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Full Screen with Image-Based Background */}
      <AnimatePresence>
        <motion.div 
          className="fixed inset-0 z-50 flex flex-col overflow-hidden touch-manipulation"
          style={{
            height: '100dvh',
            minHeight: '-webkit-fill-available',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Translucent blur background */}
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
          />
          
          {/* Blurred image as background */}
          {!isVideo && (
            <div 
              className="absolute inset-0 opacity-40"
              style={{
                backgroundImage: `url(${imageUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                filter: 'blur(60px) saturate(1.2)',
              }}
            />
          )}
          
          {/* Content container */}
          <div className="relative z-10 flex-1 flex flex-col h-full">
            {/* Header - Title center, Close button on right */}
            <div 
              className="flex items-center justify-between px-5 pb-4"
              style={{ paddingTop: 'max(env(safe-area-inset-top, 24px), 24px)' }}
            >
              <div className="w-10" /> {/* Spacer for centering */}
              <span className="text-white/80 text-base font-medium">Share</span>
              <button 
                onClick={handleCloseToHome}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-xl tap-bounce active:scale-95"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
            
             {/* Main Content - Scrollable with extra padding for fixed CTA */}
             <div className="flex-1 overflow-y-auto scrollbar-hide px-6" style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 24px))' }}>
               <div className="flex flex-col items-center pt-4">
               {/* Preview Card - locked to 9:16 with shared-element exit animation */}
                <motion.div 
                 className="relative w-full max-w-[280px] aspect-[9/16] rounded-[20px] overflow-hidden"
                 data-shared-element="share-preview-card"
                 animate={isExiting ? {
                   scale: 0.15,
                   opacity: 0,
                   y: -300, // Move up toward where progress strip will be
                   x: -80,  // Move left toward first card position
                 } : {
                   scale: 1,
                   opacity: 1,
                   y: 0,
                   x: 0,
                 }}
                 transition={{
                   type: 'spring',
                   stiffness: 400,
                   damping: 35,
                   mass: 0.8,
                 }}
               >
                 {/* Glass border + glow */}
                 <div className="absolute inset-0 rounded-[20px] ring-1 ring-white/15" />
                 <div
                   className="absolute -inset-10 opacity-60"
                   style={{
                     background:
                       'radial-gradient(closest-side, rgba(255,255,255,0.16), transparent 65%)',
                     filter: 'blur(16px)',
                   }}
                 />

                 <div
                   className="absolute inset-0"
                   style={{
                     boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
                   }}
                 />

                 <div className="relative z-10 w-full h-full">
                   {renderFramePreview()}
                 </div>
                </motion.div>
                
                {/* Edit, Download, Copy buttons - all in one row */}
                <motion.div 
                  className="flex justify-center gap-3 mt-3 mb-4"
                  animate={isExiting ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      if (onEdit) onEdit();
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm tap-bounce transition-all active:scale-95"
                  >
                    <Pencil className="w-4 h-4 text-white/70" />
                    <span className="text-white/70 font-medium text-sm">Edit</span>
                  </button>
                  
                  <button
                    onClick={handleDownload}
                    disabled={downloadState === 'downloading'}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-sm tap-bounce transition-all active:scale-95 ${
                      downloadState === 'success' 
                        ? 'bg-emerald-500/20' 
                        : downloadState === 'downloading'
                          ? 'bg-white/5 opacity-70'
                          : 'bg-white/10'
                    }`}
                  >
                    {downloadState === 'downloading' ? (
                      <Loader2 className="w-4 h-4 text-white/70 animate-spin" />
                    ) : downloadState === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Download className="w-4 h-4 text-white/70" />
                    )}
                    <span className={`font-medium text-sm ${
                      downloadState === 'success' ? 'text-emerald-400' : 'text-white/70'
                    }`}>
                      {downloadState === 'downloading' ? 'Saving...' : downloadState === 'success' ? 'Saved!' : 'Download'}
                    </span>
                  </button>
                  
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-sm tap-bounce transition-all active:scale-95"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-white/70" />
                    )}
                    <span className="text-white/70 font-medium text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                  </button>
                </motion.div>
              
               {/* Reel Progress Pill - Show only at week ends (day 3, 6, 9, 12) */}
               {isWeekEnd && currentWeekConfig && (reelPhotos.length >= 3 || isGeneratingReel) && (
                 <motion.div
                   className="w-full mb-4 px-4"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.2 }}
                 >
                   <ReelProgressPill
                      weekNumber={currentWeekConfig.week}
                      state={
                        currentReel?.videoUrl 
                          ? 'complete' 
                          : currentReel?.videoTaskId
                            ? 'rendering' 
                            : 'creating'
                      }
                      progress={reelProgress}
                       onPlay={() => {
                         triggerHaptic('medium');
                         // Navigate to reel page with the week recap video as first story
                         navigate('/reel', {
                           state: {
                             weekRecapVideo: weekRecapVideo,
                             weekNumber: currentWeekConfig?.week,
                           },
                         });
                       }}
                   />
                 </motion.div>
               )}
              
               {/* Scrollable Social Apps Row - Show 50% of next icon */}
              <motion.div 
                className="w-full overflow-x-auto scrollbar-hide"
                animate={isExiting ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex gap-5 pl-4 pr-[calc(50%-28px)] min-w-max">
                  {socialApps.map((app) => (
                    <button
                      key={app.name}
                      onClick={() => handleShare(app)}
                      className="flex flex-col items-center gap-2 tap-bounce flex-shrink-0"
                    >
                      <div 
                        className="w-14 h-14 rounded-full flex items-center justify-center text-white transition-all hover:scale-110 active:scale-95"
                        style={{ 
                          backgroundColor: app.color,
                        }}
                      >
                        {app.icon}
                      </div>
                      <span className="text-white/70 text-[11px] font-medium">{app.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
              </div>
            </div>
            
             {/* Floating Bottom Action Button - VIEW PROGRESS only, always visible */}
            <div 
              className="fixed left-0 right-0 z-30 px-6"
              style={{ 
                bottom: 0,
                paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
                paddingTop: '20px',
                background: 'rgba(255, 255, 255, 0.04)',
                backdropFilter: 'blur(40px) saturate(180%)',
                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
                maskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to top, black 80%, transparent 100%)',
              }}
            >
              <motion.div 
                className="w-full max-w-sm mx-auto"
                animate={isExiting ? { opacity: 0, y: 30 } : { opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
               {/* View Progress button */}
                <button
                  onClick={handleViewProgress}
                  className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-white text-black font-semibold tap-bounce transition-all active:scale-95"
                  style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
                >
                  <span>VIEW PROGRESS</span>
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};

export default ShareSheet;
