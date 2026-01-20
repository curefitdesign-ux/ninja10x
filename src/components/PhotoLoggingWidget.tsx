import { motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Sample logged photos for demo
const loggedPhotos = [
  "/placeholder.svg",
  "/placeholder.svg",
  "/placeholder.svg",
];

interface CardClusterProps {
  type: "logged" | "add" | "future";
  yOffset?: number;
}

const CardCluster = ({ type, yOffset = 0 }: CardClusterProps) => {
  const navigate = useNavigate();
  const cardWidth = 52;
  const cardHeight = 68;
  const borderRadius = 12;
  
  // Shared translucent blurred card style
  const baseCardStyle = {
    width: cardWidth,
    height: cardHeight,
    borderRadius,
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(12px)",
  };
  
  if (type === "logged") {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/")}
        className="relative flex-shrink-0"
        style={{ 
          width: cardWidth * 1.5,
          height: cardHeight * 1.3,
          marginTop: yOffset,
        }}
      >
        {/* Third card (back) */}
        <div 
          className="absolute rounded-xl overflow-hidden border-2 border-white/30 shadow-lg"
          style={{
            ...baseCardStyle,
            transform: "rotate(-8deg) translateX(-4px)",
            top: 0,
            left: 4,
            zIndex: 1,
          }}
        >
          <img 
            src={loggedPhotos[2]} 
            alt="Photo 3"
            className="w-full h-full object-cover opacity-60"
          />
        </div>
        
        {/* Second card (middle) */}
        <div 
          className="absolute rounded-xl overflow-hidden border-2 border-white/40 shadow-lg"
          style={{
            ...baseCardStyle,
            transform: "rotate(6deg) translateX(8px)",
            top: 4,
            left: 12,
            zIndex: 2,
          }}
        >
          <img 
            src={loggedPhotos[1]} 
            alt="Photo 2"
            className="w-full h-full object-cover opacity-70"
          />
        </div>
        
        {/* Front card */}
        <div 
          className="absolute rounded-xl overflow-hidden border-2 border-white/50 shadow-xl"
          style={{
            ...baseCardStyle,
            transform: "rotate(-3deg)",
            top: 8,
            left: 0,
            zIndex: 3,
          }}
        >
          <img 
            src={loggedPhotos[0]} 
            alt="Photo 1"
            className="w-full h-full object-cover opacity-80"
          />
        </div>
      </motion.button>
    );
  }
  
  if (type === "add") {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => navigate("/")}
        className="relative flex-shrink-0"
        style={{ 
          width: cardWidth * 1.6,
          height: cardHeight * 1.3,
          marginTop: yOffset,
        }}
      >
        {/* Subtle glow effect behind */}
        <div 
          className="absolute rounded-2xl blur-xl"
          style={{
            width: cardWidth * 1.4,
            height: cardHeight * 0.8,
            top: -12,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 0,
            background: "rgba(255,255,255,0.15)",
          }}
        />
        
        {/* Third card (back) */}
        <div 
          className="absolute rounded-xl overflow-hidden border border-white/20 shadow-lg"
          style={{
            ...baseCardStyle,
            transform: "rotate(-6deg)",
            top: 0,
            left: 4,
            zIndex: 1,
          }}
        />
        
        {/* Second card (middle) - with X icon */}
        <div 
          className="absolute rounded-xl overflow-hidden border border-white/25 shadow-lg"
          style={{
            ...baseCardStyle,
            transform: "rotate(8deg) translateX(10px)",
            top: 4,
            left: 16,
            zIndex: 2,
          }}
        >
          {/* X icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <X className="w-5 h-5 text-white/60" strokeWidth={2.5} />
          </div>
        </div>
        
        {/* Front card - with plus icon */}
        <div 
          className="absolute rounded-xl overflow-hidden border border-white/30 shadow-xl"
          style={{
            ...baseCardStyle,
            transform: "rotate(-5deg)",
            top: 8,
            left: 0,
            zIndex: 3,
          }}
        >
          {/* Plus icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Plus className="w-6 h-6 text-teal-400" strokeWidth={2.5} />
          </div>
        </div>
      </motion.button>
    );
  }
  
  // Future placeholder cards - same 3-card layout
  return (
    <div 
      className="relative flex-shrink-0"
      style={{ 
        width: cardWidth * 1.5,
        height: cardHeight * 1.3,
        marginTop: yOffset,
      }}
    >
      {/* Third card (back) */}
      <div 
        className="absolute rounded-xl border border-white/10"
        style={{
          ...baseCardStyle,
          opacity: 0.6,
          transform: "rotate(-6deg)",
          top: 0,
          left: 4,
          zIndex: 1,
        }}
      />
      
      {/* Second card (middle) */}
      <div 
        className="absolute rounded-xl border border-white/[0.12]"
        style={{
          ...baseCardStyle,
          opacity: 0.7,
          transform: "rotate(5deg) translateX(6px)",
          top: 4,
          left: 10,
          zIndex: 2,
        }}
      />
      
      {/* Front card */}
      <div 
        className="absolute rounded-xl border border-white/[0.15]"
        style={{
          ...baseCardStyle,
          opacity: 0.8,
          transform: "rotate(-2deg)",
          top: 8,
          left: 0,
          zIndex: 3,
        }}
      />
    </div>
  );
};

const PhotoLoggingWidget = () => {
  // 4 clusters: logged, add, future, future
  const clusters = [
    { type: "logged" as const, yOffset: 8 },
    { type: "add" as const, yOffset: 0 },
    { type: "future" as const, yOffset: 8 },
    { type: "future" as const, yOffset: 0 },
  ];
  
  return (
    <div className="relative w-full" style={{ height: 140 }}>
      {/* Timeline Path - SVG curved dashed line */}
      <svg 
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 100"
        preserveAspectRatio="xMidYMid meet"
        style={{ overflow: "visible" }}
      >
        <path
          d="M 20 60 Q 60 30, 120 50 Q 180 70, 240 45 Q 300 20, 360 50 Q 400 70, 420 55"
          fill="none"
          stroke="rgba(255,255,255,0.4)"
          strokeWidth="1.5"
          strokeDasharray="6 4"
          strokeLinecap="round"
        />
      </svg>
      
      {/* Cards Container - horizontal scroll */}
      <div className="relative flex items-center justify-start gap-4 px-4 py-4 overflow-x-auto scrollbar-hide h-full">
        {clusters.map((cluster, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 * idx }}
          >
            <CardCluster type={cluster.type} yOffset={cluster.yOffset} />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PhotoLoggingWidget;
