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

  // Check if already authenticated
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Check if profile exists
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
        // Profile check happens in onAuthStateChange
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
        // Show profile setup for new users
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
      <div className="min-h-screen flex items-center justify-center bg-black">
        <motion.div 
          className="w-12 h-12 rounded-full"
          style={{
            background: 'linear-gradient(135deg, hsl(160, 84%, 39%) 0%, hsl(172, 66%, 50%) 100%)',
          }}
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </div>
    );
  }

  if (showProfileSetup) {
    return <ProfileSetup onComplete={handleProfileComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-black">
      {/* Animated gradient background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Floating gradient orbs */}
        <motion.div
          className="absolute w-[300px] h-[300px] rounded-full opacity-40 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(160, 84%, 39%) 0%, transparent 70%)',
            filter: 'blur(80px)',
            top: '-10%',
            left: '-5%',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[250px] h-[250px] rounded-full opacity-30 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(172, 66%, 50%) 0%, transparent 70%)',
            filter: 'blur(60px)',
            bottom: '5%',
            right: '-5%',
          }}
          animate={{
            x: [0, -20, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-[200px] h-[200px] rounded-full opacity-20 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, hsl(280, 60%, 50%) 0%, transparent 70%)',
            filter: 'blur(50px)',
            top: '30%',
            right: '10%',
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.3, 0.2],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Content */}
      <motion.div 
        className="relative z-10 w-full max-w-[380px] mx-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Liquid glass card */}
        <div 
          className="rounded-3xl p-8 relative overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: `
              0 25px 50px -12px rgba(0, 0, 0, 0.5),
              inset 0 1px 1px rgba(255, 255, 255, 0.15),
              inset 0 -1px 1px rgba(0, 0, 0, 0.1)
            `,
          }}
        >
          {/* Inner glow effect */}
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 opacity-30 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, hsl(160, 84%, 39%) 0%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />

          {/* Header */}
          <div className="text-center mb-8 relative">
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, hsl(160, 84%, 39%) 0%, hsl(172, 66%, 50%) 100%)',
                boxShadow: '0 8px 24px rgba(52, 211, 153, 0.3)',
              }}
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="text-2xl">🏃</span>
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">
              {isLogin ? 'Welcome Back' : 'Start Your Journey'}
            </h1>
            <p className="text-white/50 text-sm">
              {isLogin 
                ? 'Sign in to continue your fitness journey' 
                : 'Create an account to begin'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/70 text-sm font-medium">Email</Label>
              <div className="relative">
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors(prev => ({ ...prev, email: undefined }));
                  }}
                  placeholder="you@example.com"
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-emerald-400/50 focus:ring-emerald-400/20 transition-all"
                  style={{
                    backdropFilter: 'blur(10px)',
                  }}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <motion.p 
                  className="text-red-400 text-xs"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.email}
                </motion.p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/70 text-sm font-medium">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors(prev => ({ ...prev, password: undefined }));
                  }}
                  placeholder="••••••••"
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-white/30 rounded-xl focus:border-emerald-400/50 focus:ring-emerald-400/20 transition-all"
                  style={{
                    backdropFilter: 'blur(10px)',
                  }}
                  disabled={loading}
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </div>
              {errors.password && (
                <motion.p 
                  className="text-red-400 text-xs"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl font-semibold text-white relative overflow-hidden disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, hsl(160, 84%, 39%) 0%, hsl(172, 66%, 50%) 100%)',
                boxShadow: '0 8px 24px rgba(52, 211, 153, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)',
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Button shimmer effect */}
              <motion.div
                className="absolute inset-0 opacity-30"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
                }}
                animate={{
                  x: ['-100%', '200%'],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              />
              <span className="relative z-10">
                {loading ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Loading...
                  </motion.span>
                ) : isLogin ? 'Sign In' : 'Create Account'}
              </span>
            </motion.button>
          </form>

          {/* Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
              }}
              className="text-white/50 hover:text-white text-sm transition-colors"
              disabled={loading}
            >
              {isLogin 
                ? "Don't have an account? " 
                : 'Already have an account? '}
              <span className="text-emerald-400 font-medium">
                {isLogin ? 'Sign up' : 'Sign in'}
              </span>
            </button>
          </div>
        </div>

        {/* Bottom decorative dots */}
        <div className="flex justify-center gap-2 mt-6">
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-white/20"
              animate={{
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.3,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
