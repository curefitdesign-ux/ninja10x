import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import { motion } from 'framer-motion';
import ProfileSetup from '@/components/ProfileSetup';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await checkProfileAndRedirect(session.user.id);
      }
    };
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session && event === 'SIGNED_IN') {
        await checkProfileAndRedirect(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const checkProfileAndRedirect = async (userId: string) => {
    setCheckingProfile(true);
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (profile) {
      navigate('/');
    } else {
      setShowProfileSetup(true);
    }
    setCheckingProfile(false);
  };

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0].message;
    }

    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) {
      newErrors.password = passwordResult.error.errors[0].message;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success('Welcome back!');
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) {
          if (error.message.includes('User already registered')) {
            toast.error('An account with this email already exists. Please sign in.');
          } else {
            toast.error(error.message);
          }
          return;
        }

        toast.success('Account created!');
        if (data.user) {
          setShowProfileSetup(true);
        }
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileComplete = () => {
    navigate('/');
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #0d3b3b 50%, #2d8a8a 100%)' }}>
        <motion.div 
          className="w-10 h-10 rounded-full"
          style={{ background: 'linear-gradient(135deg, #5eead4 0%, #14b8a6 100%)' }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.2, repeat: Infinity }}
        />
      </div>
    );
  }

  if (showProfileSetup) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-end relative overflow-hidden pb-12"
      style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #0d2d2d 30%, #1a5555 60%, #3d9999 100%)' }}
    >
      {/* Subtle ambient glow */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% 100%, rgba(94, 234, 212, 0.15) 0%, transparent 60%)',
        }}
      />

      {/* Floating glass cards decoration - top area */}
      <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-[280px]">
        {/* Phone frame outline */}
        <motion.div
          className="relative w-full aspect-[9/16] max-h-[320px] rounded-[2.5rem] overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            boxShadow: 'inset 0 0 40px rgba(255, 255, 255, 0.02)',
          }}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {/* Dynamic island */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-7 bg-black/80 rounded-full" />
          
          {/* Time display */}
          <div className="absolute top-16 left-1/2 -translate-x-1/2 text-center">
            <p className="text-white/40 text-xs tracking-wider">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-white/90 text-4xl font-light tracking-tight mt-1">
              {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </p>
          </div>

          {/* Stacked notification cards */}
          <div className="absolute bottom-8 left-4 right-4 space-y-2">
            {[
              { opacity: 0.4, y: 0, scale: 0.92, blur: 2 },
              { opacity: 0.6, y: 8, scale: 0.96, blur: 1 },
              { opacity: 1, y: 16, scale: 1, blur: 0 },
            ].map((card, i) => (
              <motion.div
                key={i}
                className="absolute bottom-0 left-0 right-0 h-16 rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  background: `rgba(255, 255, 255, ${0.06 + i * 0.02})`,
                  backdropFilter: `blur(${20 - card.blur * 3}px)`,
                  WebkitBackdropFilter: `blur(${20 - card.blur * 3}px)`,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  opacity: card.opacity,
                  transform: `translateY(-${(2 - i) * 20}px) scale(${card.scale})`,
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: card.opacity, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + i * 0.15 }}
              >
                {i === 2 && (
                  <>
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 flex items-center justify-center">
                      <span className="text-sm">🏃</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-white/90 text-sm font-medium">Start your journey</p>
                      <p className="text-white/40 text-xs">Track · Share · Grow</p>
                    </div>
                    <div className="w-6 h-6 rounded-full border border-teal-400/50 flex items-center justify-center">
                      <svg className="w-3 h-3 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Carousel dots */}
      <motion.div 
        className="absolute top-[58%] left-1/2 -translate-x-1/2 flex gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="w-6 h-1.5 rounded-full bg-white/60" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
        <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
      </motion.div>

      {/* Content section */}
      <motion.div 
        className="relative z-10 w-full max-w-[360px] px-6"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        {/* Headline */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">
            {isLogin ? 'Welcome Back' : 'Get Started'}
          </h1>
          <p className="text-white/50 text-sm leading-relaxed">
            {isLogin 
              ? 'Sign in to continue tracking your fitness journey.' 
              : 'Create an account to start your transformation.'}
          </p>
          
          {/* Feature pills */}
          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-white/40 text-xs">
              <span>✨</span>
              <span>Quick Capture</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/40 text-xs">
              <span>📱</span>
              <span>Seamless Sync</span>
            </div>
          </div>
        </div>

        {/* Form fields - minimal */}
        <form onSubmit={handleSubmit} className="space-y-4 mb-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-white/60 text-xs font-medium uppercase tracking-wider">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
              }}
              placeholder="you@example.com"
              className="h-12 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/25 rounded-2xl focus:border-teal-400/40 focus:ring-0 focus:bg-white/[0.05] transition-all"
              disabled={loading}
              autoComplete="email"
            />
            {errors.email && (
              <motion.p className="text-red-400/80 text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {errors.email}
              </motion.p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-white/60 text-xs font-medium uppercase tracking-wider">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
              }}
              placeholder="••••••••"
              className="h-12 bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/25 rounded-2xl focus:border-teal-400/40 focus:ring-0 focus:bg-white/[0.05] transition-all"
              disabled={loading}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
            {errors.password && (
              <motion.p className="text-red-400/80 text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                {errors.password}
              </motion.p>
            )}
          </div>
        </form>

        {/* Primary CTA - Liquid glass button */}
        <motion.button
          type="submit"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full h-14 rounded-2xl font-semibold text-teal-950 relative overflow-hidden disabled:opacity-50 mb-4"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,250,0.9) 100%)',
            boxShadow: '0 4px 24px rgba(20, 184, 166, 0.2), 0 1px 2px rgba(255,255,255,0.3) inset',
          }}
          whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(20, 184, 166, 0.3)' }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {loading ? (
              <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                Loading...
              </motion.span>
            ) : (
              <>
                <span>{isLogin ? 'Continue' : 'Create Account'}</span>
              </>
            )}
          </span>
        </motion.button>

        {/* Secondary action */}
        <motion.button
          onClick={() => {
            setIsLogin(!isLogin);
            setErrors({});
          }}
          className="w-full text-center py-3 text-teal-300 text-sm font-medium"
          disabled={loading}
          whileTap={{ scale: 0.98 }}
        >
          {isLogin ? 'Sign up' : 'Sign in'} <span className="text-white/40">›</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Auth;
