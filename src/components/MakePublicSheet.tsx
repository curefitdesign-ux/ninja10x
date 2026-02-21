import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Lock, Sparkles, Eye } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';
import { supabase } from '@/integrations/supabase/client';

const PUBLIC_PREFERENCE_KEY = 'user_public_preference';

interface MakePublicSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onMakePublic: () => void;
  onKeepPrivate: () => void;
  thumbnailUrl?: string;
  /** When true, renders as a fixed bottom panel without backdrop — always visible in first fold */
  inline?: boolean;
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
  // Don't save if private - we'll ask again next time
}

export default function MakePublicSheet({ 
  isOpen, 
  onClose, 
  onMakePublic,
  onKeepPrivate,
  thumbnailUrl,
  inline = false,
}: MakePublicSheetProps) {
  if (!isOpen) return null;

  const handleMakePublic = async () => {
    triggerHaptic('success');
    savePublicPreference(true);
    
    // Also update stories_public in the database
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('profiles')
        .update({ stories_public: true })
        .eq('user_id', user.id);
    }
    
    onMakePublic();
  };

  const handleKeepPrivate = () => {
    triggerHaptic('light');
    // Don't save preference - will ask again next time
    onKeepPrivate();
  };

  // Inline mode: fixed bottom panel, no backdrop, no close — always in first fold
  if (inline) {
    return (
      <motion.div
        className="fixed left-0 right-0"
        style={{
          bottom: 72,
          zIndex: 10000,
          borderTopLeftRadius: 32,
          borderTopRightRadius: 32,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
          backdropFilter: 'blur(80px) saturate(200%)',
          WebkitBackdropFilter: 'blur(80px) saturate(200%)',
          paddingBottom: 16,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 32, stiffness: 400 }}
      >
        {/* Top refraction glow */}
        <div 
          className="absolute inset-x-0 top-0 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
          }}
        />

        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-4">
          <div 
            className="w-10 h-1 rounded-full"
            style={{ background: 'rgba(255,255,255,0.2)' }}
          />
        </div>

        <div className="px-6 pb-4">
          {/* Thumbnail + Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
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

          {/* Single Make Public button */}
          <button
            onClick={handleMakePublic}
            className="w-full py-4 rounded-2xl font-semibold text-white text-base active:scale-[0.98] transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              boxShadow: '0 4px 24px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <div className="flex items-center justify-center gap-2">
              <Globe className="w-5 h-5" />
              Make Public
            </div>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.8) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Bottom sheet */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 z-50"
            style={{
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              background: 'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
              backdropFilter: 'blur(80px) saturate(200%)',
              WebkitBackdropFilter: 'blur(80px) saturate(200%)',
              paddingBottom: 'max(env(safe-area-inset-bottom, 28px), 28px)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.12)',
              borderTop: '1px solid rgba(255,255,255,0.1)',
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 400 }}
          >
            {/* Top refraction glow */}
            <div 
              className="absolute inset-x-0 top-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
              }}
            />

            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-4">
              <div 
                className="w-10 h-1 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.2)',
                }}
              />
            </div>

            <div className="px-6 pb-4">
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

              {/* Benefits - Clean borderless items */}
              <div className="space-y-3 mb-5">
                <div className="flex items-center gap-3 px-1">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(52,211,153,0.12)',
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-white/60 text-sm">Get reactions from friends</span>
                </div>
                
                <div className="flex items-center gap-3 px-1">
                  <div 
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(59,130,246,0.12)',
                    }}
                  >
                    <Eye className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-white/60 text-sm">See others' progress</span>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-2.5">
                <button
                  onClick={handleMakePublic}
                  className="w-full py-4 rounded-2xl font-semibold text-white text-base active:scale-[0.98] transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                    boxShadow: '0 4px 24px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Globe className="w-5 h-5" />
                    Make Public
                  </div>
                </button>

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
    </AnimatePresence>
  );
}