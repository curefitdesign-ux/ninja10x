// Floating glass tab bar — Home | Discover | My Progress | Alerts | ⋮ Menu
import { useState, useEffect } from "react";
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

const BottomNavBar = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [showNotificationSheet, setShowNotificationSheet] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [showEllipsisMenu, setShowEllipsisMenu] = useState(false);
  const [showMediaSourceSheet, setShowMediaSourceSheet] = useState(false);

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

  const activeTab = location.pathname === "/progress" ? "progress" : "discover";

  const handleTabClick = (tabId: string) => {
    if (tabId === "bell") {
      setShowNotificationSheet(true);
      return;
    }
    if (tabId === "menu") {
      setShowEllipsisMenu(prev => !prev);
      return;
    }
    if (tabId === "discover") {
      if (location.pathname !== "/reel" && location.pathname !== "/") navigate("/reel");
    }
    if (tabId === "progress") {
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
      <div
        className="fixed left-1/2 -translate-x-1/2"
        style={{
          bottom: "calc(max(env(safe-area-inset-bottom, 10px), 10px) + 24px)",
          zIndex: 40,
        }}
      >
        <div
          className="relative"
          style={{
            borderRadius: 9999,
            padding: 1,
            background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)",
          }}
        >
          <div
            className="relative overflow-hidden"
            style={{
              borderRadius: 9999,
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

            <div className="flex items-center justify-evenly px-2 py-2">
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
                <div style={{ color: "rgba(200, 210, 230, 0.6)", opacity: 0.5 }} className="relative">
                  <Bell className="w-5 h-5" strokeWidth={1.5} />
                  {unreadNotificationCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full" style={{
                      background: '#EF4444',
                      border: '1.5px solid rgba(0,0,0,0.5)',
                      boxShadow: '0 0 6px rgba(239, 68, 68, 0.6)',
                    }} />
                  )}
                </div>
                <span className="text-[10px] mt-0.5 tracking-wide whitespace-nowrap" style={{ color: "rgba(200, 210, 230, 0.5)", fontWeight: 400 }}>Alerts</span>
              </button>

              {/* Menu */}
              <div className="relative">
                <button onClick={() => handleTabClick("menu")} className={btnClass}>
                  <div style={{ color: "rgba(200, 210, 230, 0.6)", opacity: 0.5 }}>
                    <MoreVertical className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <span className="text-[10px] mt-0.5 tracking-wide whitespace-nowrap" style={{ color: "rgba(200, 210, 230, 0.5)", fontWeight: 400 }}>Menu</span>
                </button>

                <AnimatePresence>
                  {showEllipsisMenu && (
                    <>
                      <motion.div className="fixed inset-0 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowEllipsisMenu(false)} />
                      <motion.div
                        className="absolute right-0 bottom-full mb-2 w-52 z-50 rounded-2xl overflow-hidden"
                        style={{
                          background: "rgba(20, 20, 30, 0.95)",
                          backdropFilter: "blur(40px) saturate(180%)",
                          border: "1px solid rgba(255, 255, 255, 0.12)",
                          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)",
                        }}
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="py-1">
                          <motion.button onClick={() => { setShowEllipsisMenu(false); setShowMediaSourceSheet(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-white/80 hover:text-white hover:bg-white/5 transition-colors" whileHover={{ x: 2 }}>
                            <Plus className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm">Log Activity</span>
                          </motion.button>
                          <motion.button onClick={() => { setShowEllipsisMenu(false); navigate("/profile-setup?edit=true"); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-white/80 hover:text-white hover:bg-white/5 transition-colors" whileHover={{ x: 2 }}>
                            <UserPen className="w-4 h-4 text-emerald-400" />
                            <span className="text-sm">Edit Profile</span>
                          </motion.button>
                          <motion.button onClick={async () => { setShowEllipsisMenu(false); try { await supabase.auth.signOut(); toast.success("Logged out successfully"); navigate("/auth"); } catch { toast.error("Failed to log out"); } }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-white/80 hover:text-red-400 hover:bg-red-500/5 transition-colors" whileHover={{ x: 2 }}>
                            <LogOut className="w-4 h-4" />
                            <span className="text-sm">Log Out</span>
                          </motion.button>
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      <NotificationSheet isOpen={showNotificationSheet} onClose={() => setShowNotificationSheet(false)} onNotificationCountChange={setUnreadNotificationCount} />
      <MediaSourceSheet isOpen={showMediaSourceSheet} onClose={() => setShowMediaSourceSheet(false)} dayNumber={activityCount + 1} />
    </>
  );
};

export default BottomNavBar;
