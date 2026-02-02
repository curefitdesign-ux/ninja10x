import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Dumbbell, Activity as ActivityIcon, ShoppingBag, Users } from "lucide-react";

interface BottomNavBarProps {
  hidden?: boolean;
}

const navItems = [
  { id: "home", icon: Home, label: "HOME", path: "/" },
  { id: "fitness", icon: Dumbbell, label: "FITNESS", path: "/" },
  { id: "activity", icon: ActivityIcon, label: "ACTIVITY", isCenter: true, path: "/" },
  { id: "store", icon: ShoppingBag, label: "STORE", path: "/" },
  { id: "social", icon: Users, label: "SOCIAL", path: "/" },
];

const BottomNavBar = ({ hidden = false }: BottomNavBarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("activity");

  // Hide on auth and profile setup pages
  const hiddenPaths = ["/auth", "/profile-setup", "/avatar-crop", "/camera", "/preview"];
  const shouldHide = hidden || hiddenPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  const handleNavClick = (item: typeof navItems[0]) => {
    setActiveTab(item.id);
    if (item.path && location.pathname !== item.path) {
      navigate(item.path);
    }
  };

  const nav = (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      className="fixed bottom-0 left-0 right-0"
      style={{
        zIndex: 9999,
        position: "fixed",
      }}
    >
      {/* Premium liquid glass container - clear translucent */}
      <div
        className="relative mx-0"
        style={{
          background: "rgba(255, 255, 255, 0.06)",
          backdropFilter: "blur(40px) saturate(180%)",
          WebkitBackdropFilter: "blur(40px) saturate(180%)",
          borderTop: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: `
            0 -4px 30px rgba(0, 0, 0, 0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.1)
          `,
        }}
      >
        {/* Micro-texture noise overlay */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          }}
        />
        
        {/* Top edge refraction glow */}
        <div
          className="absolute inset-x-0 top-0 h-[2px] pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.15) 30%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0.15) 70%, transparent 95%)",
          }}
        />
        
        {/* Inner glow along top */}
        <div
          className="absolute inset-x-0 top-0 h-8 pointer-events-none"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, transparent 100%)",
          }}
        />

        <div 
          className="relative flex items-center justify-around py-2.5 px-2"
          style={{ paddingBottom: "max(calc(env(safe-area-inset-bottom, 8px) + 4px), 12px)" }}
        >
          {navItems.map((item) => {
            if (item.isCenter) {
              return (
                <motion.button
                  key={item.id}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleNavClick(item)}
                  className="relative -mt-8 flex flex-col items-center"
                >
                  {/* Bloom halo effect */}
                  <motion.div 
                    className="absolute -inset-4 rounded-full pointer-events-none"
                    animate={{ 
                      opacity: [0.4, 0.6, 0.4],
                      scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    style={{ 
                      background: "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(96, 165, 250, 0.2) 40%, transparent 70%)",
                      filter: "blur(8px)",
                    }}
                  />
                  {/* Secondary glow ring */}
                  <div 
                    className="absolute -inset-2 rounded-full opacity-60"
                    style={{ 
                      background: "radial-gradient(circle, rgba(59, 130, 246, 0.5) 0%, transparent 60%)",
                      filter: "blur(6px)",
                    }}
                  />
                  {/* Main glossy liquid glass button - solid blue, no cutout */}
                  <div 
                    className="relative w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(145deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)",
                      boxShadow: `
                        0 6px 24px rgba(59, 130, 246, 0.6),
                        0 2px 8px rgba(0, 0, 0, 0.4),
                        inset 0 2px 4px rgba(255, 255, 255, 0.3),
                        inset 0 -2px 6px rgba(0, 0, 0, 0.15)
                      `,
                      border: "1px solid rgba(255, 255, 255, 0.25)",
                    }}
                  >
                    {/* Specular highlight */}
                    <div 
                      className="absolute top-1.5 left-3 right-3 h-3 rounded-full pointer-events-none"
                      style={{
                        background: "linear-gradient(180deg, rgba(255,255,255,0.35) 0%, transparent 100%)",
                      }}
                    />
                    <item.icon className="w-6 h-6 text-white drop-shadow-lg relative z-10" />
                  </div>
                  {/* Label below center button */}
                  <span className="text-[8px] mt-2 font-semibold tracking-wider text-white/90">
                    {item.label}
                  </span>
                </motion.button>
              );
            }
            
            const isActive = activeTab === item.id;
            
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleNavClick(item)}
                className="flex flex-col items-center py-1 px-3 transition-all duration-300 relative"
              >
                {/* Active glow behind icon */}
                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="absolute top-0 w-10 h-10 rounded-full pointer-events-none"
                    style={{
                      background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
                      filter: "blur(4px)",
                    }}
                  />
                )}
                <item.icon
                  className={`w-5 h-5 transition-all duration-300 ${
                    isActive 
                      ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                      : "text-white/35"
                  }`}
                />
                <span
                  className={`text-[9px] mt-1.5 font-medium tracking-wider transition-all duration-300 ${
                    isActive ? "text-white/95" : "text-white/35"
                  }`}
                >
                  {item.label}
                </span>
                {/* Active indicator line with glow */}
                {isActive && (
                  <motion.div
                    layoutId="navIndicator"
                    className="absolute -bottom-0.5 w-8 h-[3px] rounded-full"
                    style={{ 
                      background: "linear-gradient(90deg, #10b981 0%, #34d399 50%, #6ee7b7 100%)",
                      boxShadow: "0 0 10px rgba(16, 185, 129, 0.6), 0 0 20px rgba(52, 211, 153, 0.3)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
        
        {/* Bottom vignette effect */}
        <div
          className="absolute inset-x-0 bottom-0 h-4 pointer-events-none"
          style={{
            background: "linear-gradient(0deg, rgba(0,0,0,0.2) 0%, transparent 100%)",
          }}
        />
      </div>
    </motion.nav>
  );

  return typeof document !== "undefined" ? createPortal(nav, document.body) : nav;
};

export default BottomNavBar;
