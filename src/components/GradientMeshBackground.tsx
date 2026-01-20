import { motion } from "framer-motion";

const GradientMeshBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Deep dark base - matching reference */}
      <div className="absolute inset-0 bg-[#1a1a24]" />
      
      {/* Top-left dusty taupe/beige glow */}
      <motion.div
        animate={{
          x: [0, 8, -5, 0],
          y: [0, -6, 4, 0],
        }}
        transition={{
          duration: 45,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute w-[80vw] max-w-[500px] h-[80vw] max-h-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(30, 12%, 45%, 0.5) 0%, hsla(20, 10%, 35%, 0.3) 40%, transparent 70%)',
          top: '-10%',
          left: '-15%',
          filter: 'blur(80px)',
        }}
      />
      
      {/* Top-right deep navy/indigo orb */}
      <motion.div
        animate={{
          x: [0, -6, 4, 0],
          y: [0, 5, -4, 0],
        }}
        transition={{
          duration: 50,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5,
        }}
        className="absolute w-[90vw] max-w-[550px] h-[90vw] max-h-[550px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(230, 40%, 40%, 0.55) 0%, hsla(240, 35%, 30%, 0.35) 40%, transparent 70%)',
          top: '5%',
          right: '-25%',
          filter: 'blur(90px)',
        }}
      />
      
      {/* Center muted purple/mauve blend */}
      <motion.div
        animate={{
          x: [0, 5, -8, 0],
          y: [0, -4, 6, 0],
        }}
        transition={{
          duration: 55,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 10,
        }}
        className="absolute w-[85vw] max-w-[480px] h-[85vw] max-h-[480px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(280, 25%, 35%, 0.4) 0%, hsla(260, 20%, 28%, 0.25) 40%, transparent 70%)',
          top: '35%',
          left: '5%',
          filter: 'blur(95px)',
        }}
      />
      
      {/* Bottom-right subtle teal/olive hint */}
      <motion.div
        animate={{
          x: [0, -4, 6, 0],
          y: [0, 4, -5, 0],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 15,
        }}
        className="absolute w-[60vw] max-w-[320px] h-[60vw] max-h-[320px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(140, 20%, 28%, 0.35) 0%, hsla(160, 18%, 22%, 0.2) 40%, transparent 70%)',
          bottom: '10%',
          right: '5%',
          filter: 'blur(70px)',
        }}
      />
      
      {/* Bottom deep navy/purple */}
      <motion.div
        animate={{
          x: [0, 6, -4, 0],
          y: [0, -3, 5, 0],
        }}
        transition={{
          duration: 52,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 8,
        }}
        className="absolute w-[100vw] max-w-[550px] h-[50vw] max-h-[350px] rounded-full"
        style={{
          background: 'radial-gradient(circle, hsla(235, 35%, 22%, 0.55) 0%, hsla(250, 30%, 16%, 0.35) 45%, transparent 75%)',
          bottom: '-15%',
          left: '-10%',
          filter: 'blur(90px)',
        }}
      />
      
      {/* Grainy texture overlay - enhanced */}
      <div 
        className="absolute inset-0 opacity-[0.35] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Secondary grain layer for more texture */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='grain'%3E%3CfeTurbulence type='turbulence' baseFrequency='0.7' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23grain)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Subtle vignette */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(12, 12, 20, 0.6) 100%)',
        }}
      />
    </div>
  );
};

export default GradientMeshBackground;
