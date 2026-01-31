import { motion } from "framer-motion";

const GradientMeshBackground = () => {
  return (
    <div 
      className="fixed overflow-hidden pointer-events-none"
      style={{
        top: 'calc(-1 * env(safe-area-inset-top, 0px))',
        left: 0,
        right: 0,
        bottom: 0,
      }}
    >
      {/* Deep muted base - extends into safe area */}
      <div className="absolute inset-0 bg-[#252535]" />
      
      {/* Top-left warm taupe/brown glow - more visible */}
      <motion.div
        animate={{
          x: [0, 20, -15, 0],
          y: [0, -18, 14, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[120vw] max-w-[700px] h-[120vw] max-h-[700px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(25, 25%, 55%, 0.75) 0%, hsla(15, 20%, 45%, 0.5) 35%, hsla(350, 15%, 38%, 0.25) 55%, transparent 75%)',
          top: '-25%',
          left: '-30%',
          filter: 'blur(60px)',
        }}
      />
      
      {/* Top-right bright blue accent spot - more visible */}
      <motion.div
        animate={{
          x: [0, -15, 10, 0],
          y: [0, 12, -10, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2,
        }}
        className="absolute w-[60vw] max-w-[350px] h-[60vw] max-h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(210, 65%, 60%, 0.65) 0%, hsla(220, 55%, 50%, 0.4) 40%, transparent 70%)',
          top: '-12%',
          right: '0%',
          filter: 'blur(50px)',
        }}
      />
      
      {/* Top-right deep navy/indigo orb - more visible */}
      <motion.div
        animate={{
          x: [0, -18, 12, 0],
          y: [0, 15, -12, 0],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 4,
        }}
        className="absolute w-[100vw] max-w-[550px] h-[100vw] max-h-[550px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(230, 55%, 50%, 0.75) 0%, hsla(235, 50%, 40%, 0.5) 40%, transparent 70%)',
          top: '-5%',
          right: '-25%',
          filter: 'blur(70px)',
        }}
      />
      
      {/* Center muted mauve/purple blend - more visible */}
      <motion.div
        animate={{
          x: [0, 15, -20, 0],
          y: [0, -12, 16, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 8,
        }}
        className="absolute w-[110vw] max-w-[600px] h-[110vw] max-h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(270, 28%, 45%, 0.55) 0%, hsla(260, 22%, 38%, 0.35) 40%, transparent 70%)',
          top: '25%',
          left: '-15%',
          filter: 'blur(80px)',
        }}
      />
      
      {/* Bottom-right deep purple/navy blend - more visible */}
      <motion.div
        animate={{
          x: [0, -12, 16, 0],
          y: [0, 10, -14, 0],
        }}
        transition={{
          duration: 38,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 10,
        }}
        className="absolute w-[90vw] max-w-[500px] h-[90vw] max-h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(245, 40%, 42%, 0.65) 0%, hsla(255, 35%, 32%, 0.4) 40%, transparent 70%)',
          bottom: '0%',
          right: '-10%',
          filter: 'blur(75px)',
        }}
      />
      
      {/* Bottom-left warm undertone - more visible */}
      <motion.div
        animate={{
          x: [0, 18, -12, 0],
          y: [0, -10, 14, 0],
        }}
        transition={{
          duration: 32,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 6,
        }}
        className="absolute w-[80vw] max-w-[450px] h-[80vw] max-h-[450px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(350, 22%, 40%, 0.5) 0%, hsla(330, 18%, 32%, 0.3) 40%, transparent 70%)',
          bottom: '5%',
          left: '-20%',
          filter: 'blur(70px)',
        }}
      />
      
      {/* Subtle grain texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Soft vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 35%, rgba(20, 20, 35, 0.35) 100%)',
        }}
      />
    </div>
  );
};

export default GradientMeshBackground;
