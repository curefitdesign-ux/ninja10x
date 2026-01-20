import { motion } from "framer-motion";

const GradientMeshBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Deep muted base - matching reference */}
      <div className="absolute inset-0 bg-[#2a2a3a]" />
      
      {/* Top-left warm taupe/brown glow - matching reference */}
      <motion.div
        animate={{
          x: [0, 12, -8, 0],
          y: [0, -10, 8, 0],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[100vw] max-w-[600px] h-[100vw] max-h-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(25, 18%, 50%, 0.6) 0%, hsla(15, 15%, 42%, 0.4) 35%, hsla(350, 12%, 35%, 0.2) 55%, transparent 75%)',
          top: '-20%',
          left: '-25%',
          filter: 'blur(70px)',
        }}
      />
      
      {/* Top-right bright blue accent spot */}
      <motion.div
        animate={{
          x: [0, -8, 5, 0],
          y: [0, 6, -5, 0],
        }}
        transition={{
          duration: 35,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 3,
        }}
        className="absolute w-[50vw] max-w-[280px] h-[50vw] max-h-[280px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(210, 55%, 55%, 0.5) 0%, hsla(220, 50%, 45%, 0.3) 40%, transparent 70%)',
          top: '-8%',
          right: '5%',
          filter: 'blur(60px)',
        }}
      />
      
      {/* Top-right deep navy/indigo orb */}
      <motion.div
        animate={{
          x: [0, -10, 6, 0],
          y: [0, 8, -6, 0],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute w-[90vw] max-w-[500px] h-[90vw] max-h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(230, 50%, 45%, 0.65) 0%, hsla(235, 45%, 35%, 0.4) 40%, transparent 70%)',
          top: '0%',
          right: '-20%',
          filter: 'blur(80px)',
        }}
      />
      
      {/* Center muted mauve/purple blend */}
      <motion.div
        animate={{
          x: [0, 8, -10, 0],
          y: [0, -6, 8, 0],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 10,
        }}
        className="absolute w-[100vw] max-w-[550px] h-[100vw] max-h-[550px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(270, 20%, 40%, 0.45) 0%, hsla(260, 18%, 32%, 0.3) 40%, transparent 70%)',
          top: '30%',
          left: '-10%',
          filter: 'blur(90px)',
        }}
      />
      
      {/* Bottom-right deep purple/navy blend */}
      <motion.div
        animate={{
          x: [0, -6, 8, 0],
          y: [0, 5, -7, 0],
        }}
        transition={{
          duration: 55,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 12,
        }}
        className="absolute w-[80vw] max-w-[450px] h-[80vw] max-h-[450px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(245, 35%, 38%, 0.55) 0%, hsla(255, 30%, 28%, 0.35) 40%, transparent 70%)',
          bottom: '5%',
          right: '-5%',
          filter: 'blur(85px)',
        }}
      />
      
      {/* Bottom-left warm undertone */}
      <motion.div
        animate={{
          x: [0, 10, -6, 0],
          y: [0, -5, 7, 0],
        }}
        transition={{
          duration: 48,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 8,
        }}
        className="absolute w-[70vw] max-w-[400px] h-[70vw] max-h-[400px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(350, 18%, 35%, 0.4) 0%, hsla(330, 15%, 28%, 0.25) 40%, transparent 70%)',
          bottom: '10%',
          left: '-15%',
          filter: 'blur(80px)',
        }}
      />
      
      {/* Grainy texture overlay - matching reference */}
      <div 
        className="absolute inset-0 opacity-[0.4] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Secondary fine grain layer */}
      <div 
        className="absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Soft vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(20, 20, 35, 0.4) 100%)',
        }}
      />
    </div>
  );
};

export default GradientMeshBackground;
