// v4 – liquid glass nav with teal activity glow
import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Dumbbell, ShoppingBag, Waves, Activity } from "lucide-react";

const navItems = [
  { id: "home", label: "Home", path: "/", Icon: Home },
  { id: "fitness", label: "Fitness", path: "/", Icon: Dumbbell },
  { id: "activity", label: "Activity", path: "/", Icon: Activity },
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
        borderRadius: "20px 20px 0 0",
        overflow: "hidden",
        /* Liquid glass: dark base + frosted surface + inner highlight */
        background: `
          linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.07) 0%,
            rgba(10, 7, 32, 0.30) 100%
          )
        `,
        backdropFilter: "blur(48px) saturate(190%)",
        WebkitBackdropFilter: "blur(48px) saturate(190%)",
        borderTop: "1px solid rgba(255, 255, 255, 0.13)",
        boxShadow: `
          inset 0 1px 0 rgba(255, 255, 255, 0.12),
          0 -8px 32px rgba(0, 0, 0, 0.35),
          0 -2px 8px rgba(0, 0, 0, 0.20)
        `,
      }}
    >
      <div
        className="flex items-end justify-around px-1"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 6px), 6px)" }}
      >
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const isActivity = item.id === "activity";

          const iconColor = isActivity && isActive
            ? TEAL
            : isActive
            ? "#ffffff"
            : "rgba(180, 160, 220, 0.5)";

          const labelColor = isActivity && isActive
            ? TEAL
            : isActive
            ? "#ffffff"
            : "rgba(180, 160, 220, 0.5)";

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className="pressable flex flex-col items-center pt-2 pb-1 px-3 relative"
            >
              <div className="relative flex items-center justify-center">
                {/* Subtle teal glow behind active activity icon */}
                {isActive && isActivity && (
                  <div
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      inset: "-8px",
                      background: "radial-gradient(ellipse at center, rgba(15, 228, 152, 0.22) 0%, rgba(0, 190, 255, 0.10) 55%, transparent 80%)",
                      filter: "blur(6px)",
                    }}
                  />
                )}
                <item.Icon
                  className="transition-all duration-150 relative z-10"
                  style={{
                    width: isActivity ? "26px" : "22px",
                    height: isActivity ? "26px" : "22px",
                    color: iconColor,
                    strokeWidth: isActive ? 2.2 : 1.6,
                    filter: isActivity && isActive
                      ? "drop-shadow(0 0 5px rgba(15, 228, 152, 0.55))"
                      : "none",
                  }}
                />
              </div>
              <span
                className="text-[10px] mt-1 tracking-wide transition-colors duration-150"
                style={{
                  color: labelColor,
                  fontWeight: isActive ? 600 : 400,
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
