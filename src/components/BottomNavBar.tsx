// Floating glassmorphic pill nav — Back · Discover · My Progress
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, Compass, BarChart3 } from "lucide-react";

const BottomNavBar = ({ hidden = false }: { hidden?: boolean }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const hiddenPaths = ["/auth", "/profile-setup", "/avatar-crop", "/camera", "/preview", "/gallery"];
  const shouldHide = hidden || hiddenPaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  const isDiscover = location.pathname === "/reel" || location.pathname === "/";
  const isProgress = location.pathname === "/progress";

  const nav = (
    <nav
      className="fixed left-1/2 -translate-x-1/2"
      style={{
        bottom: "max(env(safe-area-inset-bottom, 12px), 12px)",
        zIndex: 9999,
        borderRadius: 9999,
        overflow: "hidden",
        width: "min(340px, 88vw)",
        /* Floating glassmorphic pill */
        background: `linear-gradient(
          135deg,
          rgba(255, 255, 255, 0.12) 0%,
          rgba(255, 255, 255, 0.05) 50%,
          rgba(100, 140, 180, 0.08) 100%
        )`,
        backdropFilter: "blur(48px) saturate(190%)",
        WebkitBackdropFilter: "blur(48px) saturate(190%)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        boxShadow: `
          inset 0 1px 0 rgba(255, 255, 255, 0.2),
          inset 0 -1px 0 rgba(255, 255, 255, 0.05),
          0 8px 32px rgba(0, 0, 0, 0.35),
          0 2px 8px rgba(0, 0, 0, 0.2)
        `,
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{ height: 54, paddingInline: 6 }}
      >
        {/* Back button */}
        <button
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/");
            }
          }}
          className="flex items-center justify-center active:scale-[0.92] transition-transform"
          style={{
            width: 42,
            height: 42,
            borderRadius: 9999,
            background: "rgba(255, 255, 255, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.12)",
          }}
        >
          <ChevronLeft
            className="text-white/80"
            style={{ width: 20, height: 20, strokeWidth: 2 }}
          />
        </button>

        {/* Divider */}
        <div
          style={{
            width: 1,
            height: 28,
            background: "rgba(255, 255, 255, 0.15)",
            flexShrink: 0,
          }}
        />

        {/* Discover */}
        <button
          onClick={() => {
            if (location.pathname !== "/reel") navigate("/reel");
          }}
          className="flex flex-col items-center gap-0.5 active:scale-[0.95] transition-transform flex-1"
        >
          <Compass
            style={{
              width: 22,
              height: 22,
              color: isDiscover ? "#ffffff" : "rgba(180, 160, 220, 0.55)",
              strokeWidth: isDiscover ? 2.2 : 1.6,
            }}
          />
          <span
            className="text-[11px] tracking-wide"
            style={{
              color: isDiscover ? "#ffffff" : "rgba(180, 160, 220, 0.55)",
              fontWeight: isDiscover ? 700 : 400,
            }}
          >
            Discover
          </span>
        </button>

        {/* My Progress */}
        <button
          onClick={() => {
            if (location.pathname !== "/progress") navigate("/progress");
          }}
          className="flex flex-col items-center gap-0.5 active:scale-[0.95] transition-transform flex-1"
        >
          <BarChart3
            style={{
              width: 22,
              height: 22,
              color: isProgress ? "#ffffff" : "rgba(180, 160, 220, 0.55)",
              strokeWidth: isProgress ? 2.2 : 1.6,
            }}
          />
          <span
            className="text-[11px] tracking-wide"
            style={{
              color: isProgress ? "#ffffff" : "rgba(180, 160, 220, 0.55)",
              fontWeight: isProgress ? 700 : 400,
            }}
          >
            My Progress
          </span>
        </button>
      </div>
    </nav>
  );

  return typeof document !== "undefined" ? createPortal(nav, document.body) : nav;
};

export default BottomNavBar;
