import { motion, AnimatePresence } from 'framer-motion';
import { Delete, Check } from 'lucide-react';
import { triggerHaptic } from '@/hooks/use-haptic-feedback';

interface ContextualNumericKeyboardProps {
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  label: string;
  unit: string;
  presets?: number[];
  allowDecimal?: boolean;
  maxLength?: number;
}

const ContextualNumericKeyboard = ({
  value,
  onChange,
  onConfirm,
  onClose,
  label,
  unit,
  presets = [],
  allowDecimal = false,
  maxLength = 5,
}: ContextualNumericKeyboardProps) => {
  const handleKeyPress = (key: string) => {
    triggerHaptic('light');
    
    if (key === 'delete') {
      onChange(value.slice(0, -1));
      return;
    }
    
    if (key === '.' && allowDecimal) {
      if (!value.includes('.') && value.length < maxLength) {
        onChange(value + '.');
      }
      return;
    }
    
    if (value.length < maxLength) {
      // Prevent leading zeros except for decimal
      if (value === '0' && key !== '.') {
        onChange(key);
      } else {
        onChange(value + key);
      }
    }
  };
  
  const handlePreset = (preset: number) => {
    triggerHaptic('medium');
    onChange(String(preset));
  };
  
  const handleConfirm = () => {
    triggerHaptic('success');
    onConfirm();
  };
  
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', allowDecimal ? '.' : '', '0', 'delete'];
  
  return (
    <>
      {/* Backdrop */}
      <motion.div 
        className="fixed inset-0 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
        onClick={onClose}
      />
      
      {/* Keyboard Sheet */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 z-50"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
      >
        <div 
          className="rounded-t-3xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(50, 50, 55, 0.98) 0%, rgba(35, 35, 38, 0.99) 100%)',
            backdropFilter: 'blur(60px) saturate(200%)',
            WebkitBackdropFilter: 'blur(60px) saturate(200%)',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>
          
          {/* Display area */}
          <div className="px-6 pb-4">
            <p className="text-white/60 text-sm text-center mb-2">{label}</p>
            <div 
              className="flex items-center justify-center gap-2 py-3 rounded-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <span className="text-white text-4xl font-bold tracking-tight">
                {value || '0'}
              </span>
              {unit && (
                <span className="text-white/50 text-xl font-medium">{unit}</span>
              )}
            </div>
          </div>
          
          {/* Quick presets */}
          {presets.length > 0 && (
            <div className="px-4 pb-3">
              <div className="flex gap-2 justify-center flex-wrap">
                {presets.map((preset) => (
                  <motion.button
                    key={preset}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handlePreset(preset)}
                    className="px-4 py-2 rounded-full"
                    style={{
                      background: value === String(preset) 
                        ? 'rgba(52, 211, 153, 0.25)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      border: value === String(preset) 
                        ? '1px solid rgba(52, 211, 153, 0.5)' 
                        : '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <span 
                      className="text-sm font-semibold"
                      style={{ 
                        color: value === String(preset) ? '#34d399' : 'rgba(255,255,255,0.8)' 
                      }}
                    >
                      {preset} {unit}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          
          {/* Numeric keypad */}
          <div className="px-3 pb-2">
            <div className="grid grid-cols-3 gap-1.5">
              {keys.map((key, index) => (
                <motion.button
                  key={index}
                  whileTap={{ scale: 0.95, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                  onClick={() => key && handleKeyPress(key)}
                  disabled={!key}
                  className="h-14 rounded-xl flex items-center justify-center transition-colors"
                  style={{
                    background: key === 'delete' 
                      ? 'rgba(255, 100, 100, 0.15)' 
                      : key 
                        ? 'rgba(255, 255, 255, 0.08)' 
                        : 'transparent',
                    border: key ? '1px solid rgba(255, 255, 255, 0.06)' : 'none',
                  }}
                >
                  {key === 'delete' ? (
                    <Delete className="w-6 h-6 text-red-400" />
                  ) : (
                    <span className="text-white text-2xl font-semibold">{key}</span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
          
          {/* Confirm button */}
          <div 
            className="px-4 pt-2"
            style={{ 
              paddingBottom: 'max(env(safe-area-inset-bottom, 16px), 16px)' 
            }}
          >
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirm}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                boxShadow: '0 4px 20px rgba(52, 211, 153, 0.3)',
              }}
            >
              <Check className="w-5 h-5 text-black" />
              <span className="text-black font-bold text-base">Confirm</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default ContextualNumericKeyboard;
