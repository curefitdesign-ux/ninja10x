import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, UserPen, ChevronDown, Mail, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useProfile } from '@/hooks/use-profile';
import { toast } from 'sonner';

interface ProfileMenuProps {
  onEditProfile?: () => void;
}

const ProfileMenu = ({ onEditProfile }: ProfileMenuProps) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/auth');
    } catch {
      toast.error('Failed to log out');
    }
  };

  const handleEditProfile = () => {
    setIsOpen(false);
    navigate('/profile-setup?edit=true');
  };

  return (
    <>
      <div className="relative">
        {/* Profile Button - Simple avatar only */}
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20 hover:ring-emerald-400/40 transition-all"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {profile?.avatar_url ? (
            <img 
              src={profile.avatar_url} 
              alt={profile.display_name || 'Profile'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {profile?.display_name?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
          )}
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                className="fixed inset-0 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
              />
              
              {/* Menu - Liquid Glass - Position left since button is on left side */}
              <motion.div
                className="absolute left-0 top-full mt-2 w-56 z-50 rounded-2xl overflow-hidden"
                style={{
                  background: 'rgba(20, 20, 30, 0.95)',
                  backdropFilter: 'blur(40px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  boxShadow: `
                    0 20px 40px rgba(0, 0, 0, 0.4),
                    inset 0 1px 1px rgba(255, 255, 255, 0.1)
                  `,
                }}
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {/* User Info Header */}
                <div className="px-4 py-4 border-b border-white/10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-emerald-400/30">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.display_name || 'Profile'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                          <User className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {profile?.display_name || 'User'}
                      </p>
                      <p className="text-white/40 text-xs truncate mt-0.5">
                        Fitness Journey
                      </p>
                    </div>
                  </div>
                  
                  {/* Email Display */}
                  {user?.email && (
                    <div 
                      className="flex items-center gap-2 px-3 py-2 rounded-lg"
                      style={{
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.06)',
                      }}
                    >
                      <Mail className="w-3.5 h-3.5 text-emerald-400/70" />
                      <span className="text-white/50 text-xs truncate">{user.email}</span>
                    </div>
                  )}
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <motion.button
                    onClick={handleEditProfile}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                    whileHover={{ x: 2 }}
                  >
                    <UserPen className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm">Edit Profile</span>
                  </motion.button>

                  <motion.button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-white/80 hover:text-red-400 hover:bg-red-500/5 transition-colors"
                    whileHover={{ x: 2 }}
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm">Log Out</span>
                  </motion.button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

    </>
  );
};

export default ProfileMenu;
