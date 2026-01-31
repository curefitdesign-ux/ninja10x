import { motion, AnimatePresence } from 'framer-motion';
import { Globe, Lock, Sparkles, Eye } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';

interface MakePublicSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onMakePublic: () => void;
  onKeepPrivate: () => void;
  thumbnailUrl?: string;
}

export default function MakePublicSheet({ 
  isOpen, 
  onClose, 
  onMakePublic,
  onKeepPrivate,
  thumbnailUrl,
}: MakePublicSheetProps) {
  if (!isOpen) return null;

  const handleMakePublic = () => {
    triggerHaptic('success');
    onMakePublic();
  };

  const handleKeepPrivate = () => {
    triggerHaptic('light');
    onKeepPrivate();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.85) 100%)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
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
              background: 'linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
              backdropFilter: 'blur(60px) saturate(180%)',
              WebkitBackdropFilter: 'blur(60px) saturate(180%)',
              paddingBottom: 'max(env(safe-area-inset-bottom, 28px), 28px)',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)',
              borderTop: '1px solid rgba(255,255,255,0.12)',
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
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
              }}
            />

            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-5">
              <div 
                className="w-10 h-1 rounded-full"
                style={{
                  background: 'rgba(255,255,255,0.25)',
                }}
              />
            </div>

            <div className="px-6 pb-4">
              {/* Thumbnail + Icon */}
              <div className="flex justify-center mb-5">
                <div className="relative">
                  {thumbnailUrl ? (
                    <div 
                      className="w-20 h-20 rounded-2xl overflow-hidden"
                      style={{
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.15)',
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
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.3) 0%, rgba(99,102,241,0.2) 100%)',
                        boxShadow: '0 8px 32px rgba(139,92,246,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
                        border: '2px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      <Eye className="w-8 h-8 text-white/80" />
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
              <h2 className="text-white text-xl font-semibold text-center mb-2 tracking-tight">
                Share with Community?
              </h2>

              {/* Description */}
              <p className="text-white/50 text-center text-sm mb-6 leading-relaxed max-w-[280px] mx-auto">
                Make public to get reactions & see what others are achieving
              </p>

              {/* Benefits - Liquid glass cards */}
              <div className="space-y-2.5 mb-6">
                <div 
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(52,211,153,0.25) 0%, rgba(16,185,129,0.15) 100%)',
                      border: '1px solid rgba(52,211,153,0.2)',
                    }}
                  >
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-white text-sm font-medium block">Get reactions</span>
                    <p className="text-white/40 text-xs mt-0.5">Friends can cheer you on</p>
                  </div>
                </div>
                
                <div 
                  className="flex items-center gap-3.5 p-3.5 rounded-2xl"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59,130,246,0.25) 0%, rgba(99,102,241,0.15) 100%)',
                      border: '1px solid rgba(59,130,246,0.2)',
                    }}
                  >
                    <Eye className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <span className="text-white text-sm font-medium block">See others' progress</span>
                    <p className="text-white/40 text-xs mt-0.5">Unlock the community feed</p>
                  </div>
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
                  className="w-full py-3.5 rounded-2xl font-medium text-white/60 text-base active:scale-[0.98] transition-all duration-200"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    Keep Private
                  </div>
                </button>
              </div>

              <p className="text-white/30 text-xs text-center mt-4">
                You can change this anytime
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}