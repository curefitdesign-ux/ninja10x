import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { usePortalContainer } from '@/hooks/use-portal-container';
import { Globe, Lock, Sparkles, Eye, X, Check } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import { supabase } from '@/integrations/supabase/client';

const PUBLIC_PREFERENCE_KEY = 'user_public_preference';

interface MakePublicSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onMakePublic: () => void;
  onKeepPrivate: () => void;
  thumbnailUrl?: string;
}

// Check if user has previously chosen to make activities public
export function hasUserChosenPublic(): boolean {
  return localStorage.getItem(PUBLIC_PREFERENCE_KEY) === 'true';
}

// Save user's public preference
function savePublicPreference(isPublic: boolean) {
  if (isPublic) {
    localStorage.setItem(PUBLIC_PREFERENCE_KEY, 'true');
  }
}

export default function MakePublicSheet({ 
  isOpen, 
  onClose, 
  onMakePublic,
  onKeepPrivate,
  thumbnailUrl,
}: MakePublicSheetProps) {

  const portalContainer = usePortalContainer();
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(false);

  const handleMakePublic = async () => {
    setIsPublishing(true);
    triggerHaptic('success');
    savePublicPreference(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Update profile to public
      await supabase
        .from('profiles')
        .update({ stories_public: true })
        .eq('user_id', user.id);
      
      // Make ALL user's activities public
      await supabase
        .from('journey_activities')
        .update({ is_public: true })
        .eq('user_id', user.id);
    }
    
    setIsPublishing(false);
    setPublishSuccess(true);
    triggerHaptic('success');
    
    // Brief success state then close
    setTimeout(() => {
      setPublishSuccess(false);
      onMakePublic();
    }, 800);
  };

  const handleKeepPrivate = () => {
    triggerHaptic('light');
    onKeepPrivate();
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0"
            style={{ zIndex: 9998, background: 'rgba(0,0,0,0.6)' }}
            onClick={onClose}
          />

          {/* Sheet - fixed to viewport bottom, same pattern as MediaSourceSheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed left-0 right-0 rounded-t-3xl overflow-hidden"
            style={{
              bottom: 0,
              zIndex: 9999,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
              backdropFilter: 'blur(60px) saturate(200%)',
              WebkitBackdropFilter: 'blur(60px) saturate(200%)',
              boxShadow: '0 -8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.12)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {/* Top refraction glow */}
            <div 
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              }}
            />

            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-4 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <X className="w-4 h-4 text-white/70" />
            </button>

            <div className="px-6 pb-6">
              {/* Thumbnail + Icon */}
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {thumbnailUrl ? (
                    <div 
                      className="w-20 h-20 rounded-2xl overflow-hidden"
                      style={{
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      <img 
                        src={thumbnailUrl} 
                        alt="Activity" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div 
                      className="w-20 h-20 rounded-2xl flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(99,102,241,0.15) 100%)',
                        boxShadow: '0 8px 32px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <Eye className="w-8 h-8 text-white/70" />
                    </div>
                  )}
                  
                  {/* Globe badge */}
                  <div 
                    className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                      boxShadow: '0 4px 12px rgba(139,92,246,0.5)',
                      border: '2px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <Globe className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Title */}
              <h2 className="text-white text-xl font-semibold text-center mb-5 tracking-tight">
                Share with Community?
              </h2>

              {/* Benefits */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3 px-1">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(52,211,153,0.12)' }}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-white/60 text-sm">Get reactions from friends</span>
                </div>
                
                <div className="flex items-center gap-3 px-1">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(59,130,246,0.12)' }}
                  >
                    <Eye className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-white/60 text-sm">See others' progress</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2.5">
                <motion.button
                  onClick={handleMakePublic}
                  disabled={isPublishing || publishSuccess}
                  className="w-full py-4 rounded-2xl font-semibold text-white text-base transition-all duration-200"
                  style={{
                    background: publishSuccess 
                      ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                      : 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    boxShadow: publishSuccess
                      ? '0 4px 24px rgba(16,185,129,0.4), inset 0 1px 0 rgba(255,255,255,0.2)'
                      : '0 4px 24px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                  whileTap={{ scale: 0.97 }}
                  animate={publishSuccess ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <div className="flex items-center justify-center gap-2">
                    {publishSuccess ? (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <Check className="w-5 h-5" />
                      </motion.div>
                    ) : isPublishing ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Globe className="w-5 h-5" />
                    )}
                    {publishSuccess ? 'Public!' : isPublishing ? 'Publishing...' : 'Make Public'}
                  </div>
                </motion.button>

                <button
                  onClick={handleKeepPrivate}
                  className="w-full py-3.5 rounded-2xl font-medium text-white/50 text-base active:scale-[0.98] transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    Keep Private
                  </div>
                </button>
              </div>

              <p className="text-white/20 text-xs text-center mt-3">
                Change anytime in settings
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalContainer
  );
}
