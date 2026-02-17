import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Dumbbell, Trophy, ShoppingBag, Waves } from "lucide-react";

const navItems = [
  { id: "home", icon: Home, label: "Home", path: "/" },
  { id: "fitness", icon: Dumbbell, label: "Fitness", path: "/" },
  { id: "sports", icon: Trophy, label: "Sports", path: "/" },
  { id: "store", icon: ShoppingBag, label: "Store", path: "/" },
  { id: "pilates", icon: Waves, label: "Pilates", path: "/" },
];

const BottomNavBar = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("home");

  const hiddenPaths = ["/auth", "/profile-setup", "/avatar-crop", "/camera", "/preview", "/gallery", "/reel", "/progress"];
  const shouldHide = hidden || hiddenPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  const handleNavClick = (item: typeof navItems[0]) => {
    setActiveTab(item.id);
    if (item.path && location.pathname !== item.path) {
      navigate(item.path);
    }
  };

  const nav = (
    <nav
      className="fixed bottom-0 left-0 right-0"
      style={{
        zIndex: 9999,
        background: "hsl(var(--background))",
        borderTop: "1px solid hsl(var(--border))",
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
              <item.icon
                className="w-[22px] h-[22px] transition-colors duration-150"
                style={{
                  color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  strokeWidth: isActive ? 2.2 : 1.6,
                }}
              />
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
