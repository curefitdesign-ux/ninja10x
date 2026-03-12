import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import cultLogo from '@/assets/cult-logo.svg';

const Logout = () => {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const performLogout = async () => {
      // Check if user is already logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // User is logged in — redirect to /reel instead of logging out
        navigate('/reel', { replace: true });
        return;
      }
      setChecked(true);
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.error('[Logout] signOut error:', e);
      } finally {
        setSigningOut(false);
      }
    };
    performLogout();
  }, [navigate]);

  if (!checked) return null;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #0d2d2d 40%, #1a5555 70%, #3d9999 100%)' }}
    >
      <motion.div
        className="relative z-10 w-full max-w-[360px] text-center"
        style={{ marginTop: '-40px' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo */}
        <motion.img
          src={cultLogo}
          alt="Cult Logo"
          className="w-12 h-14 mx-auto mb-6"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        />

        {/* Glass card */}
        <div
          className="rounded-3xl p-8 mb-6"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-highlight), var(--glass-shadow)',
          }}
        >
          {signingOut ? (
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255, 255, 255, 0.08)' }}
                animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                <LogOut className="w-5 h-5 text-white/60" />
              </motion.div>
              <p className="text-white/60 text-sm">Signing out...</p>
            </motion.div>
          ) : (
            <motion.div
              className="flex flex-col items-center gap-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(94, 234, 212, 0.1)',
                  border: '1px solid rgba(94, 234, 212, 0.2)',
                }}
              >
                <LogOut className="w-6 h-6 text-teal-400" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-1">You're logged out</h2>
                <p className="text-white/50 text-sm">
                  Thanks for using Cult. See you next session!
                </p>
              </div>
            </motion.div>
          )}
        </div>

        {/* Sign in again button */}
        {!signingOut && (
          <motion.button
            onClick={() => navigate('/', { replace: true })}
            className="w-full h-14 rounded-xl font-semibold text-teal-950 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,250,0.9) 100%)',
              boxShadow: '0 4px 20px rgba(20, 184, 166, 0.25)',
            }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
          >
            Sign In Again
          </motion.button>
        )}
      </motion.div>
    </div>
  );
};

export default Logout;
