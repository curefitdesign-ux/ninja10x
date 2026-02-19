// v5 – matches new reference design: Home, Fitness, Activity (active), Store, Pilates
import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Dumbbell, ShoppingBag, Waves } from "lucide-react";

// Custom Activity pulse icon
const ActivityIcon = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const navItems = [
  { id: "home", label: "Home", path: "/", Icon: Home },
  { id: "fitness", label: "Fitness", path: "/", Icon: Dumbbell },
  { id: "activity", label: "Activity", path: "/", Icon: null },
  { id: "store", label: "Store", path: "/", Icon: ShoppingBag },
  { id: "pilates", label: "Pilates", path: "/", Icon: Waves },
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
      window.location.href = "curefit://hometab";
      return;
    }
    if (item.path && location.pathname !== item.path) {
      navigate(item.path);
    }
  };

  const TEAL = "#0FE498";

  const nav = (
    <nav
      className="fixed bottom-0 left-0 right-0"
      style={{
        zIndex: 9999,
        background: "rgba(20, 18, 42, 0.92)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        borderTop: "1px solid rgba(255, 255, 255, 0.07)",
      }}
    >
      <div
        className="flex items-end justify-around px-2"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 8px), 8px)", paddingTop: "4px" }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isActivity = item.id === "activity";

          const iconColor = isActive && !isActivity
            ? "#ffffff"
            : !isActive
            ? "rgba(180, 160, 220, 0.45)"
            : TEAL;

          const labelColor = isActive && !isActivity
            ? "#ffffff"
            : !isActive
            ? "rgba(180, 160, 220, 0.45)"
            : TEAL;

          if (isActivity) {
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className="flex flex-col items-center relative"
                style={{ paddingBottom: 2, marginTop: -12 }}
              >
                {/* Floating pill circle */}
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{
                    width: 52,
                    height: 52,
                    background: isActive
                      ? "linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)"
                      : "rgba(255,255,255,0.08)",
                    boxShadow: isActive
                      ? "0 4px 20px rgba(99, 102, 241, 0.55)"
                      : "none",
                    border: "1px solid rgba(255,255,255,0.12)",
                  }}
                >
                  <ActivityIcon color="#ffffff" size={24} />
                </div>
                <span
                  className="text-[10px] mt-1.5 tracking-wide font-semibold"
                  style={{ color: isActive ? TEAL : "rgba(180,160,220,0.45)" }}
                >
                  {item.label}
                </span>
              </button>
            );
          }

          const IconComp = item.Icon!;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className="flex flex-col items-center pt-2 pb-1 px-2"
            >
              <IconComp
                style={{
                  width: 22,
                  height: 22,
                  color: iconColor,
                  strokeWidth: isActive ? 2.2 : 1.6,
                }}
              />
              <span
                className="text-[10px] mt-1 tracking-wide"
                style={{ color: labelColor, fontWeight: isActive ? 600 : 400 }}
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
