// Floating glass tab bar — matches reference: Back circle | Discover | My Progress
import { cn } from "@/lib/utils";
import { Map } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import progressIcon from "@/assets/nav/progress-icon.png";

const BackIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className={className}>
    <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14 8L10 12L14 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const navTabs = [
  { id: "home", icon: <BackIcon className="w-6 h-6" />, label: "Home" },
  { id: "discover", icon: <Map className="w-5 h-5" />, label: "Discover" },
  { id: "progress", icon: <img src={progressIcon} alt="My Progress" className="w-5 h-5 object-contain" />, label: "My Progress" },
];

const BottomNavBar = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const hiddenPaths = ["/auth", "/profile-setup", "/avatar-crop", "/camera", "/preview", "/gallery"];
  const shouldHide = hidden || hiddenPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  // Determine active tab from route
  const activeTab = location.pathname === "/progress" ? "progress" : "discover";

  const handleTabClick = (tabId: string) => {
    if (tabId === "home") {
      // Deep-link back to host app or go home
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate("/");
      }
      return;
    }
    if (tabId === "discover") {
      if (location.pathname !== "/reel" && location.pathname !== "/") navigate("/reel");
    }
    if (tabId === "progress") {
      if (location.pathname !== "/progress") navigate("/progress");
    }
  };

  const nav = (
    <div
      className="fixed left-1/2 -translate-x-1/2"
      style={{
        bottom: "calc(max(env(safe-area-inset-bottom, 10px), 10px) + 8px)",
        zIndex: 40,
      }}
    >
      {/* Outer container with frosted glass */}
      <div
        className="relative"
        style={{
          borderRadius: 9999,
          padding: 1,
          /* Subtle outer border — thin light stroke */
          background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.06) 100%)",
        }}
      >
        {/* Inner glass surface */}
        <div
          className="relative overflow-hidden"
          style={{
            borderRadius: 9999,
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(60px) saturate(200%)",
            WebkitBackdropFilter: "blur(60px) saturate(200%)",
            boxShadow: `
              inset 0 1px 0 rgba(255,255,255,0.12),
              inset 0 -0.5px 0 rgba(255,255,255,0.04)
            `,
          }}
        >
          {/* Inner top light beam */}
          <div
            className="absolute top-0 left-[15%] right-[15%] h-px pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
            }}
          />

          {/* Tabs container */}
          <div className="flex items-center px-2 py-2">
            {navTabs.map((tab, index) => {
              const isActive = activeTab === tab.id;
              const isHome = tab.id === "home";

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabClick(tab.id)}
                  className={cn(
                    "relative flex flex-col items-center justify-center",
                    "py-1 px-4 min-w-[70px]",
                    "transition-all duration-300 ease-out",
                    "focus:outline-none active:scale-[0.95]"
                  )}
                >
                  {/* Vertical divider after Home */}
                  {isHome && (
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2"
                      style={{
                        width: 1,
                        height: 28,
                        background: "rgba(255,255,255,0.18)",
                      }}
                    />
                  )}

                  {/* Icon */}
                  <div
                    className="transition-all duration-300"
                    style={{
                      color: isActive
                        ? "#ffffff"
                        : "rgba(200, 210, 230, 0.6)",
                      opacity: isActive ? 1 : 0.3,
                      transform: isActive ? "scale(1.1)" : "scale(1)",
                    }}
                  >
                    {tab.icon}
                  </div>

                  {/* Label */}
                  <span
                    className="text-[10px] mt-0.5 tracking-wide transition-all duration-300 whitespace-nowrap"
                    style={{
                      color: isActive
                        ? "#ffffff"
                        : "rgba(200, 210, 230, 0.5)",
                      fontWeight: isActive ? 700 : 400,
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  return nav;
};

export default BottomNavBar;
