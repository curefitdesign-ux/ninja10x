import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Dumbbell, ShoppingBag, Waves } from "lucide-react";
import activityActive from "@/assets/nav/activity-active.png";
import activityInactive from "@/assets/nav/activity-inactive.png";

const navItems = [
  { id: "home", label: "Home", path: "/", type: "icon" as const, Icon: Home },
  { id: "fitness", label: "Fitness", path: "/", type: "icon" as const, Icon: Dumbbell },
  { id: "activity", label: "Activity", path: "/", type: "image" as const, Icon: null },
  { id: "store", label: "Store", path: "/", type: "icon" as const, Icon: ShoppingBag },
  { id: "pilates", label: "Pilates", path: "/", type: "icon" as const, Icon: Waves },
];

const BottomNavBar = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("activity");

  const hiddenPaths = ["/auth", "/profile-setup", "/avatar-crop", "/camera", "/preview", "/gallery", "/reel", "/progress"];
  const shouldHide = hidden || hiddenPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  const handleNavClick = (item: typeof navItems[0]) => {
    setActiveTab(item.id);
    if (item.id === "home") {
      // Deep link to curefit home tab
      window.location.href = "curefit://hometab";
      return;
    }
    if (item.path && location.pathname !== item.path) {
      navigate(item.path);
    }
  };

  const nav = (
    <nav
      className="fixed bottom-0 left-0 right-0"
      style={{
        zIndex: 9999,
        background: "rgba(10, 7, 32, 0.10)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        borderTop: "1px solid rgba(255, 255, 255, 0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="flex items-end justify-around px-1"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 6px), 6px)" }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className="pressable flex flex-col items-center pt-2 pb-1 px-3 relative"
            >
              {item.type === "image" ? (
                <div className="relative flex items-center justify-center">
                  {/* Subtle glow halo behind the active activity icon */}
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background: "radial-gradient(ellipse at center, rgba(249, 115, 22, 0.28) 0%, rgba(236, 72, 153, 0.18) 55%, transparent 80%)",
                        transform: "scale(2.2)",
                        filter: "blur(6px)",
                      }}
                    />
                  )}
                  <img
                    src={isActive ? activityActive : activityInactive}
                    alt="Activity"
                    className="w-[32px] h-[32px] object-contain transition-opacity duration-150 relative z-10"
                    style={{ opacity: isActive ? 1 : 0.45 }}
                  />
                </div>
              ) : (
                item.Icon && (
                  <item.Icon
                    className="w-[22px] h-[22px] transition-colors duration-150"
                    style={{
                      color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                      strokeWidth: isActive ? 2.2 : 1.6,
                    }}
                  />
                )
              )}
              <span
                className="text-[10px] mt-1 font-medium tracking-wide transition-colors duration-150"
                style={{
                  color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  return typeof document !== "undefined" ? createPortal(nav, document.body) : nav;
};

export default BottomNavBar;
