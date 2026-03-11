// Floating glass tab bar — Home | Discover | My Progress | Alerts | ⋮ Menu
import { useState, useEffect, memo, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { Map, Bell, MoreVertical, Plus, UserPen, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import progressIcon from "@/assets/nav/progress-icon.png";
import NotificationSheet from "@/components/NotificationSheet";
import MediaSourceSheet from "@/components/MediaSourceSheet";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

// Tab config for the reflective indicator
const TAB_IDS = ["home", "discover", "bell", "menu"] as const;

const BottomNavBar = memo(({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [showNotificationSheet, setShowNotificationSheet] = useState(false);
  const [totalNotificationCount, setTotalNotificationCount] = useState(0);
  const seenCountRef = useRef(0);
  const [showEllipsisMenu, setShowEllipsisMenu] = useState(false);
  const [showMediaSourceSheet, setShowMediaSourceSheet] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Listen for gallery overlay open/close
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setGalleryOpen(detail?.visible ?? false);
    };
    window.addEventListener('gallery-overlay', handler);
    return () => window.removeEventListener('gallery-overlay', handler);
  }, []);

  const [activityCount, setActivityCount] = useState(0);
  useEffect(() => {
    if (!user) return;
    supabase
      .from("journey_activities")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lt("day_number", 1000)
      .then(({ count }) => setActivityCount(count || 0));
  }, [user]);

  const hiddenPaths = ["/auth", "/profile-setup", "/avatar-crop", "/camera", "/preview", "/gallery", "/reel-generation"];
  const shouldHide = hidden || hiddenPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  const activeTab = showNotificationSheet ? "bell" : location.pathname === "/progress" ? "progress" : "discover";
  const activeIndex = TAB_IDS.indexOf(activeTab as typeof TAB_IDS[number]);

  const handleTabClick = (tabId: string) => {
    if (tabId === "bell") {
      setShowNotificationSheet(prev => !prev);
      // Mark all current notifications as seen
      seenCountRef.current = totalNotificationCount;
      return;
    }
    if (tabId === "menu") {
      setShowEllipsisMenu(true);
      return;
    }
    if (tabId === "discover") {
      setShowNotificationSheet(false);
      if (location.pathname !== "/reel" && location.pathname !== "/") navigate("/reel");
    }
    if (tabId === "progress") {
      setShowNotificationSheet(false);
      if (location.pathname !== "/progress") navigate("/progress");
    }
  };

  const btnClass = cn(
    "relative flex flex-col items-center justify-center",
    "py-1 px-3 min-w-[52px]",
    "transition-all duration-300 ease-out",
    "focus:outline-none active:scale-[0.95]"
  );

  return (
    <>
      <motion.div
        className="fixed left-0 right-0 bottom-0"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          zIndex: 9999,
        }}
        animate={{ y: galleryOpen ? 100 : 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      >
        <div
          className="relative"
          style={{
            borderRadius: 0,
            padding: 1,
            background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)",
          }}
        >
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: 0,
              background: "rgba(255, 255, 255, 0.03)",
              backdropFilter: "blur(60px) saturate(200%)",
              WebkitBackdropFilter: "blur(60px) saturate(200%)",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.12), inset 0 -0.5px 0 rgba(255,255,255,0.04)`,
            }}
          >
            <div
              className="absolute top-0 left-[15%] right-[15%] h-px pointer-events-none"
              style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)" }}
            />
        <div className="relative flex items-center justify-evenly px-2 py-2">
          {/* Reflective sliding indicator */}
          <motion.div
            className="absolute pointer-events-none"
            animate={{
              left: `${(activeIndex / TAB_IDS.length) * 100 + (100 / TAB_IDS.length / 2)}%`,
            }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
            style={{
              width: '64px',
              height: '100%',
              top: 0,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Top reflective beam */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2"
              style={{
                width: '52px',
                height: '2.5px',
                borderRadius: '2px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), rgba(200,180,255,0.9), rgba(255,255,255,0.7), transparent)',
                boxShadow: '0 0 10px rgba(200,180,255,0.5), 0 0 24px rgba(180,160,240,0.3)',
              }}
            />
            {/* Glow halo */}
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2"
              style={{
                width: '64px',
                height: '28px',
                background: 'radial-gradient(ellipse at center top, rgba(180,160,255,0.18) 0%, transparent 70%)',
              }}
            />
            {/* Shimmer sweep animation */}
            <motion.div
              className="absolute top-0 left-1/2 -translate-x-1/2"
              animate={{
                opacity: [0.4, 1, 0.4],
                scaleX: [0.8, 1.1, 0.8],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{
                width: '28px',
                height: '1.5px',
                borderRadius: '1px',
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
              }}
            />
          </motion.div>

          {/* Home */}
          <button onClick={() => { window.history.length > 1 ? navigate(-1) : navigate("/"); }} className={btnClass}>
            <div style={{ color: "rgba(200, 210, 230, 0.6)", opacity: 0.5 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
                <path d="M14 8L10 12L14 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="text-[9px] mt-0.5 tracking-wide whitespace-nowrap" style={{ color: "rgba(200, 210, 230, 0.5)", fontWeight: 400 }}>Home</span>
          </button>

          {/* Discover */}
          <button onClick={() => handleTabClick("discover")} className={btnClass}>
            <div className="transition-all duration-300" style={{
              color: activeTab === "discover" ? "#ffffff" : "rgba(200, 210, 230, 0.6)",
              opacity: activeTab === "discover" ? 1 : 0.3,
              transform: activeTab === "discover" ? "scale(1.1)" : "scale(1)",
            }}>
              <Map className="w-5 h-5" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-wide whitespace-nowrap transition-all duration-300" style={{
              color: activeTab === "discover" ? "#ffffff" : "rgba(200, 210, 230, 0.5)",
              fontWeight: activeTab === "discover" ? 700 : 400,
            }}>Discover</span>
          </button>

          {/* My Progress */}
          <button onClick={() => handleTabClick("progress")} className={btnClass}>
            <div className="transition-all duration-300" style={{
              color: activeTab === "progress" ? "#ffffff" : "rgba(200, 210, 230, 0.6)",
              opacity: activeTab === "progress" ? 1 : 0.3,
              transform: activeTab === "progress" ? "scale(1.1)" : "scale(1)",
            }}>
              <img src={progressIcon} alt="My Progress" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-[10px] mt-0.5 tracking-wide whitespace-nowrap transition-all duration-300" style={{
              color: activeTab === "progress" ? "#ffffff" : "rgba(200, 210, 230, 0.5)",
              fontWeight: activeTab === "progress" ? 700 : 400,
            }}>My Progress</span>
          </button>

          {/* Alerts */}
          <button onClick={() => handleTabClick("bell")} className={btnClass}>
            <div className="relative transition-all duration-300" style={{
              color: activeTab === "bell" ? "#ffffff" : "rgba(200, 210, 230, 0.6)",
              opacity: activeTab === "bell" ? 1 : 0.5,
              transform: activeTab === "bell" ? "scale(1.1)" : "scale(1)",
            }}>
              <Bell className="w-5 h-5" strokeWidth={1.5} />
              {(() => {
                const unread = totalNotificationCount - seenCountRef.current;
                if (unread <= 0) return null;
                return (
                  <div className="absolute -top-2 -right-3 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center" style={{
                    background: '#EF4444',
                    border: '1.5px solid rgba(0,0,0,0.5)',
                    boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)',
                  }}>
                    <span className="text-white text-[9px] font-bold leading-none">{unread > 99 ? '99+' : unread}</span>
                  </div>
                );
              })()}
            </div>
            <span className="text-[10px] mt-0.5 tracking-wide whitespace-nowrap transition-all duration-300" style={{
              color: activeTab === "bell" ? "#ffffff" : "rgba(200, 210, 230, 0.5)",
              fontWeight: activeTab === "bell" ? 700 : 400,
            }}>Alerts</span>
          </button>

          {/* Menu */}
          <button onClick={() => handleTabClick("menu")} className={btnClass}>
            <div style={{ color: "rgba(200, 210, 230, 0.6)", opacity: 0.5 }}>
              <MoreVertical className="w-5 h-5" strokeWidth={1.5} />
            </div>
            <span className="text-[10px] mt-0.5 tracking-wide whitespace-nowrap" style={{ color: "rgba(200, 210, 230, 0.5)", fontWeight: 400 }}>Menu</span>
          </button>
        </div>
          </div>
        </div>
      </motion.div>

      <NotificationSheet isOpen={showNotificationSheet} onClose={() => { setShowNotificationSheet(false); seenCountRef.current = totalNotificationCount; }} onNotificationCountChange={setTotalNotificationCount} />
      <MediaSourceSheet isOpen={showMediaSourceSheet} onClose={() => setShowMediaSourceSheet(false)} dayNumber={activityCount + 1} />

      <Sheet open={showEllipsisMenu} onOpenChange={setShowEllipsisMenu}>
        <SheetContent side="bottom" className="px-0 pt-2 pb-8 rounded-t-3xl">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="flex flex-col">
            <button
              onClick={() => { setShowEllipsisMenu(false); setShowMediaSourceSheet(true); }}
              className="flex items-center gap-4 px-6 py-4 text-left transition-colors active:scale-[0.97]"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(16, 185, 129, 0.15)" }}>
                <Plus className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-[15px] font-medium">Log Activity</span>
            </button>
            <button
              onClick={() => { setShowEllipsisMenu(false); navigate("/profile-setup?edit=true"); }}
              className="flex items-center gap-4 px-6 py-4 text-left transition-colors active:scale-[0.97]"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(99, 102, 241, 0.15)" }}>
                <UserPen className="w-5 h-5 text-indigo-400" />
              </div>
              <span className="text-[15px] font-medium">Edit Profile</span>
            </button>
            <div className="mx-6 my-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
            <button
              onClick={async () => {
                setShowEllipsisMenu(false);
                try { await supabase.auth.signOut(); toast.success("Logged out successfully"); navigate("/auth"); }
                catch { toast.error("Failed to log out"); }
              }}
              className="flex items-center gap-4 px-6 py-4 text-left transition-colors active:scale-[0.97]"
              style={{ color: "rgba(239, 68, 68, 0.85)" }}
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(239, 68, 68, 0.12)" }}>
                <LogOut className="w-5 h-5 text-red-400" />
              </div>
              <span className="text-[15px] font-medium">Log Out</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
});

BottomNavBar.displayName = 'BottomNavBar';

export default BottomNavBar;
