import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import { motion } from 'framer-motion';
import ProfileSetup from '@/components/ProfileSetup';
import cultLogo from '@/assets/cult-logo.svg';

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

        if (data.session) {
          toast.success('Account created!');
          navigate('/profile-setup', { replace: true });
        } else {
          toast.success('Check your email to confirm your account.');
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
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden px-6"
      style={{ background: 'linear-gradient(180deg, #0a0a0a 0%, #0d2d2d 40%, #1a5555 70%, #3d9999 100%)' }}
    >
      {/* Content section */}
      <motion.div 
        className="relative z-10 w-full max-w-[360px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Logo and Headline */}
        <div className="mb-8 text-center">
          <motion.img 
            src={cultLogo} 
            alt="Cult Logo" 
            className="w-12 h-14 mx-auto mb-4"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          />
          <h1 className="text-3xl font-bold text-white mb-3">
            Welcome to Cult
          </h1>
          <p className="text-white/50 text-sm mb-4">
            {isLogin 
              ? 'Sign in to continue your journey.' 
              : 'Create an account to begin.'}
          </p>
          <span 
            className="inline-block px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            Beta
          </span>
        </div>

        {/* Liquid glass card */}
        <div 
          className="rounded-3xl p-6 mb-4"
          style={{
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid var(--glass-border)',
            boxShadow: 'var(--glass-highlight), var(--glass-shadow)',
          }}
        >
          {/* Form fields */}
          <form onSubmit={handleSubmit} className="space-y-4">
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
                disabled={loading}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
              />
              {errors.password && (
                <motion.p className="text-red-400/80 text-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {errors.password}
                </motion.p>
              )}
            </div>

            {/* Primary CTA */}
            <motion.button
              type="submit"
              disabled={loading}
              className="w-full h-14 rounded-xl font-semibold text-teal-950 relative overflow-hidden disabled:opacity-50 mt-2"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(240,253,250,0.9) 100%)',
                boxShadow: '0 4px 20px rgba(20, 184, 166, 0.25)',
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1, repeat: Infinity }}>
                  Loading...
                </motion.span>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </motion.button>
          </form>
        </div>

        {/* Secondary action */}
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setErrors({});
          }}
          className="w-full text-center py-3 text-teal-300 text-sm font-medium"
          disabled={loading}
        >
          {isLogin ? 'Sign up' : 'Sign in'} <span className="text-white/40">›</span>
        </button>
      </motion.div>
    </div>
  );
};

export default Auth;
